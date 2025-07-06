// src/app/api/documents-generator/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import DocumentModel from "@/lib/models/Document";
import UserModel from "@/lib/models/User";
import { verifyIdToken } from "@/lib/firebaseAdmin";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        // Autenticación
        const authHeader = req.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        // Leer body
        const { model, info } = await req.json();
        if (typeof model !== "string" || typeof info !== "string") {
            return NextResponse.json({ error: "Faltan 'model' o 'info'" }, { status: 400 });
        }

        // Llamada a OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: `Genera un documento legal según el modelo: ${model}` },
                { role: "user", content: info }
            ]
        });

        const content = completion.choices[0].message?.content?.trim() || "";
        const tokens = completion.usage?.total_tokens ?? content.split(/\s+/).filter(Boolean).length;

        // Cálculo de coste
        const COINS_PER_TOKEN = parseFloat(process.env.COINS_PER_TOKEN || "0");
        const coinsCost = Math.ceil(tokens * COINS_PER_TOKEN);

        // Conexión a DB y débito de saldo atómico
        await connectToDatabase();
        const session = await mongoose.startSession();
        await session.startTransaction();

        const usr = await UserModel.findOneAndUpdate(
            { uid: userUid, coinsBalance: { $gte: coinsCost } },
            { $inc: { coinsBalance: -coinsCost } },
            { new: true, session }
        );
        if (!usr) {
            await session.abortTransaction();
            return NextResponse.json({ error: "Saldo insuficiente" }, { status: 402 });
        }
        await session.commitTransaction();

        // Guardar documento generado
        const doc = await DocumentModel.create({
            userUid,
            model,
            info,
            content,
            tokens,
            coinsCost
        });

        return NextResponse.json(doc, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/documents-generator error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: err.status || 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        // Autenticación
        const authHeader = req.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        await connectToDatabase();
        const docs = await DocumentModel.find({ userUid }).sort({ createdAt: -1 });
        return NextResponse.json(docs);
    } catch (err: any) {
        console.error("GET /api/documents-generator error:", err);
        return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
    }
}
