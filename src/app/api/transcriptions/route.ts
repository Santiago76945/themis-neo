// src/app/api/transcriptions/route.ts

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Transcription from "@/lib/models/Transcription";
import { verifyIdToken, adminStorage } from "@/lib/firebaseAdmin";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const COINS_PER_TOKEN = parseFloat(process.env.COINS_PER_TOKEN || "0");
const COINS_PER_MB = parseFloat(process.env.COINS_PER_MB || "0");

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY must be defined");
}

/**
 * Extrae la ruta interna de storage a partir de un download URL de Firebase.
 * Por ejemplo convierte
 *   https://firebasestorage.googleapis.com/v0/b/mi-bucket/o/audios%2Fuid%2Ffile.m4a?...
 * en
 *   "audios/uid/file.m4a"
 */
function extractStoragePathFromUrl(url: string): string {
    const afterO = url.split("/o/")[1] || "";
    const [encodedPath] = afterO.split("?");
    return decodeURIComponent(encodedPath);
}

export async function POST(request: Request) {
    try {
        // 1. Autenticación
        const authHeader = request.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        // 2. Parsear entrada
        const { title, fileUrl } = await request.json();
        if (typeof title !== "string" || typeof fileUrl !== "string") {
            return NextResponse.json(
                { error: "Faltan los campos 'title' o 'fileUrl'" },
                { status: 400 }
            );
        }

        // 3. Descargar audio
        const audioRes = await fetch(fileUrl);
        if (!audioRes.ok) {
            throw new Error(`No se pudo descargar audio: ${audioRes.statusText}`);
        }
        const arrayBuffer = await audioRes.arrayBuffer();

        // 3.1 Calcular tamaño en MB
        const fileSizeBytes = arrayBuffer.byteLength;
        const fileSizeMB = fileSizeBytes / (1024 * 1024);

        // 4. Construir File para Whisper
        const urlParts = fileUrl.split("/");
        let fileName = urlParts[urlParts.length - 1] || "audio.m4a";
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

        // 5. Preparar FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", "whisper-1");
        formData.append("response_format", "text");

        // 6. Llamada a OpenAI Whisper
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

        // 7. Contar tokens y calcular coste
        const tokens = text.split(/\s+/).filter(Boolean).length;
        const tokenCost = Math.ceil(tokens * COINS_PER_TOKEN);
        const sizeCost = Math.ceil(fileSizeMB * COINS_PER_MB);
        const coinsCost = tokenCost + sizeCost;

        // 8. Guardar en MongoDB
        await connectToDatabase();
        const doc = await Transcription.create({
            userUid,
            title,
            fileUrl,
            text,
            tokens,
            coinsCost,
            // opcional: si tu esquema lo soporta, podrías guardar también fileSizeBytes y sizeCost
        });

        // 9. Eliminar el audio del bucket de Firebase
        try {
            const storagePath = extractStoragePathFromUrl(fileUrl);
            await adminStorage.file(storagePath).delete();
        } catch (firebaseErr) {
            console.error("Error al borrar audio del bucket:", firebaseErr);
            // No interrumpimos la respuesta: la transcripción ya está guardada.
        }

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
