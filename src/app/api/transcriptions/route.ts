// src/app/api/transcriptions/route.ts

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Transcription from "@/lib/models/Transcription";
import { verifyIdToken } from "@/lib/firebaseAdmin";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const COINS_PER_TOKEN = parseFloat(process.env.COINS_PER_TOKEN || "0");

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY must be defined");
}

export async function POST(request: Request) {
    try {
        // 1. Autenticación
        const authHeader = request.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        // 2. Parsear JSON de entrada
        const { title, fileUrl } = await request.json();
        if (typeof title !== "string" || typeof fileUrl !== "string") {
            return NextResponse.json(
                { error: "Faltan los campos 'title' o 'fileUrl'" },
                { status: 400 }
            );
        }

        // 3. Descargar audio desde Firebase Storage
        const audioRes = await fetch(fileUrl);
        if (!audioRes.ok) {
            throw new Error(`No se pudo descargar audio: ${audioRes.statusText}`);
        }
        const arrayBuffer = await audioRes.arrayBuffer();

        // 4. Crear un File con nombre y extensión correctos
        const urlParts = fileUrl.split("/");
        let fileName = urlParts[urlParts.length - 1] || "audio.m4a";
        // Firebase download URLs a veces tienen query params, quítalos:
        fileName = fileName.split("?")[0];
        const mimeType = fileName.toLowerCase().endsWith(".m4a")
            ? "audio/m4a"
            : fileName.endsWith(".mp3")
                ? "audio/mpeg"
                : "";

        const file = new File(
            [arrayBuffer],
            fileName,
            mimeType ? { type: mimeType } : undefined
        );

        // 5. Preparar FormData para OpenAI
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", "whisper-1");
        formData.append("response_format", "text");

        // 6. Llamar a la API de OpenAI
        const aiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
            body: formData,
        });

        if (!aiRes.ok) {
            const errText = await aiRes.text();
            throw new Error(`OpenAI API error: ${errText}`);
        }
        const text = await aiRes.text();

        // 7. Calcular tokens y coste
        const tokens = text.split(/\s+/).filter(Boolean).length;
        const coinsCost = Math.ceil(tokens * COINS_PER_TOKEN);

        // 8. Guardar en MongoDB
        await connectToDatabase();
        const doc = await Transcription.create({
            userUid,
            title,
            fileUrl,
            text,
            tokens,
            coinsCost,
        });

        return NextResponse.json(doc, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/transcriptions error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        // 1. Autenticación
        const authHeader = request.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        // 2. Leer transcripciones del usuario
        await connectToDatabase();
        const all = await Transcription.find({ userUid }).sort({ createdAt: -1 });
        return NextResponse.json(all);
    } catch (err: any) {
        console.error("GET /api/transcriptions error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: 500 }
        );
    }
}
