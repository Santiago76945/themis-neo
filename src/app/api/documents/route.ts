// src/app/api/documents/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/db";
import GeneratedDocument from "@/lib/models/Document";
import generateDocument from "@/lib/generateDocument";
import User from "@/lib/models/User";

export async function GET(request: NextRequest) {
    try {
        // 1) Autenticación
        const authHeader = request.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const { uid } = await verifyIdToken(token);

        // 2) Conexión a la base de datos
        await connectToDatabase();

        // 3) Traer documentos del usuario, incluyendo modelTitle
        const docs = await GeneratedDocument.find(
            { userUid: uid },
            "title modelTitle model info content tokens coinsCost createdAt updatedAt"
        ).sort({ createdAt: -1 });

        // 4) Devolver JSON
        return NextResponse.json(docs, { status: 200 });
    } catch (err: any) {
        console.error("GET /api/documents error:", err);
        const status = err.code === "auth/argument-error" ? 401 : 500;
        return NextResponse.json({ error: err.message }, { status });
    }
}

export async function POST(request: NextRequest) {
    try {
        // 1) Parse & log del body recibido
        const body = await request.json();
        console.log("POST /api/documents – body recibido:", JSON.stringify(body, null, 2));

        // 2) Autenticación
        const authHeader = request.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const { uid } = await verifyIdToken(token);

        // 3) Validación de campos
        const { title, modelTitle, model, info } = body;
        if (
            typeof title !== "string" ||
            typeof modelTitle !== "string" ||
            typeof model !== "string" ||
            typeof info !== "string"
        ) {
            return NextResponse.json(
                { error: "Se requieren los campos `title`, `modelTitle`, `model` e `info`" },
                { status: 400 }
            );
        }

        // 4) Generar contenido con OpenAI
        const { content, tokens, coinsCost } = await generateDocument(model, info);

        // 5) Conexión a la base de datos
        await connectToDatabase();

        // 6) Transacción para restar monedas
        const session = await (await import("mongoose")).startSession();
        session.startTransaction();
        const updatedUser = await User.findOneAndUpdate(
            { uid, coinsBalance: { $gte: coinsCost } },
            { $inc: { coinsBalance: -coinsCost } },
            { new: true, session }
        );
        if (!updatedUser) {
            await session.abortTransaction();
            return NextResponse.json({ error: "Saldo insuficiente" }, { status: 402 });
        }
        await session.commitTransaction();

        // 7) Crear documento con título y modelTitle
        const doc = await GeneratedDocument.create({
            title,
            modelTitle,    // nuevo campo
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
