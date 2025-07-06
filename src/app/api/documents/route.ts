// src/app/api/documents/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/db";
import GeneratedDocument from "@/lib/models/Document";
import generateDocument from "@/lib/generateDocument";
import User from "@/lib/models/User";

export async function GET(request: NextRequest) {
    try {
        const auth = request.headers.get("authorization") || "";
        const token = auth.replace("Bearer ", "");
        const { uid } = await verifyIdToken(token);

        await connectToDatabase();
        const docs = await GeneratedDocument.find({ userUid: uid }).sort({ createdAt: -1 });
        return NextResponse.json(docs, { status: 200 });
    } catch (err: any) {
        console.error("GET /api/documents error:", err);
        const status = err.code === "auth/argument-error" ? 401 : 500;
        return NextResponse.json({ error: err.message }, { status });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = request.headers.get("authorization") || "";
        const token = auth.replace("Bearer ", "");
        const { uid } = await verifyIdToken(token);

        const { model, info } = await request.json();
        if (typeof model !== "string" || typeof info !== "string") {
            return NextResponse.json(
                { error: "Se requieren los campos `model` e `info`" },
                { status: 400 }
            );
        }

        // Generar contenido, tokens y coste
        const { content, tokens, coinsCost } = await generateDocument(model, info);

        await connectToDatabase();

        // Transacción atómica para restar monedas
        const session = await (await import("mongoose")).startSession();
        session.startTransaction();
        const updatedUser = await User.findOneAndUpdate(
            { uid, coinsBalance: { $gte: coinsCost } },
            { $inc: { coinsBalance: -coinsCost } },
            { new: true, session }
        );
        if (!updatedUser) {
            await session.abortTransaction();
            return NextResponse.json(
                { error: "Saldo insuficiente" },
                { status: 402 }
            );
        }
        await session.commitTransaction();

        // Guardar documento generado
        const doc = await GeneratedDocument.create({
            userUid: uid,
            model,
            info,
            content,
            tokens,
            coinsCost,
        });

        return NextResponse.json(doc, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/documents error:", err);
        const isAuth = /not authorized|auth\//i.test(err.message);
        const status = isAuth ? 401 : 500;
        return NextResponse.json({ error: err.message }, { status });
    }
}
