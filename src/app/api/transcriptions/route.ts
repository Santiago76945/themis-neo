// src/app/api/transcriptions/route.ts

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Transcription from "@/lib/models/Transcription";
import { verifyIdToken, adminStorage } from "@/lib/firebaseAdmin";

// Extrae la ruta interna de storage a partir de un download URL de Firebase.
function extractStoragePathFromUrl(url: string): string {
    const afterO = url.split("/o/")[1] || "";
    const [encodedPath] = afterO.split("?");
    return decodeURIComponent(encodedPath);
}

export async function POST(request: Request) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        return NextResponse.json(
            { error: "OPENAI_API_KEY must be defined" },
            { status: 500 }
        );
    }

    // Inicializo fileUrl como opcional para evitar uso antes de asignación
    let fileUrl: string | undefined = undefined;

    try {
        const authHeader = request.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        const { title, fileUrl: incomingUrl } = await request.json();
        if (typeof title !== "string" || typeof incomingUrl !== "string") {
            return NextResponse.json(
                { error: "Faltan los campos 'title' o 'fileUrl'" },
                { status: 400 }
            );
        }
        fileUrl = incomingUrl;

        // Descargar audio
        const audioRes = await fetch(fileUrl);
        if (!audioRes.ok) {
            throw new Error(`No se pudo descargar audio: ${audioRes.statusText}`);
        }
        const arrayBuffer = await audioRes.arrayBuffer();
        const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);

        // Preparar archivo para Whisper
        const fileName = fileUrl.split('/').pop()?.split('?')[0] || 'audio';
        const mimeType =
            fileName.toLowerCase().endsWith('.mp3') ? 'audio/mpeg' :
            fileName.toLowerCase().endsWith('.m4a') ? 'audio/m4a' :
            undefined;
        const file = new File([arrayBuffer], fileName, mimeType ? { type: mimeType } : undefined);

        // Llamada a OpenAI Whisper
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", "whisper-1");
        formData.append("response_format", "text");

        const aiRes = await fetch(
            "https://api.openai.com/v1/audio/transcriptions",
            {
                method: "POST",
                headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
                body: formData,
            }
        );
        if (!aiRes.ok) {
            const errText = await aiRes.text();
            throw new Error(`OpenAI API error: ${errText}`);
        }
        const text = await aiRes.text();

        // Conectar a DB y debitar monedas
        await connectToDatabase();
        const tokens = text.split(/\s+/).filter(Boolean).length;
        const COINS_PER_TOKEN = parseFloat(process.env.COINS_PER_TOKEN || '0');
        const COINS_PER_MB    = parseFloat(process.env.COINS_PER_MB    || '0');
        const coinsCost = Math.ceil(tokens * COINS_PER_TOKEN + fileSizeMB * COINS_PER_MB);

        const session = await (await import('mongoose')).startSession();
        await session.startTransaction();
        const { default: User } = await import('@/lib/models/User');
        const usr = await User.findOneAndUpdate(
            { uid: userUid, coinsBalance: { $gte: coinsCost } },
            { $inc: { coinsBalance: -coinsCost } },
            { session, new: true }
        );
        if (!usr) {
            await session.abortTransaction();
            return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 402 });
        }
        await session.commitTransaction();

        // Guardar transcripción
        const doc = await Transcription.create({
            userUid,
            title,
            fileUrl: fileUrl!,
            text,
            tokens,
            coinsCost
        });

        // Eliminar audio del storage
        try {
            const storagePath = extractStoragePathFromUrl(fileUrl!);
            await adminStorage.file(storagePath).delete();
            console.log("Audio eliminado de Firebase Storage:", storagePath);
        } catch (deleteErr) {
            console.error("Error eliminando audio en storage:", deleteErr);
        }

        return NextResponse.json(doc, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/transcriptions error:", err, "fileUrl:", fileUrl);
        return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        await connectToDatabase();
        const all = await Transcription.find({ userUid }).sort({ createdAt: -1 });
        return NextResponse.json(all);
    } catch (err: any) {
        console.error("GET /api/transcriptions error:", err);
        return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
    }
}
