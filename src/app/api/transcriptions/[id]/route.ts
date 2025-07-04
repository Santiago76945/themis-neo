// src/app/api/transcriptions/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Transcription from "@/lib/models/Transcription";
import { verifyIdToken } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest, context: { params: { id: string } }) {
    const { id } = context.params;
    try {
        // Autenticación
        const authHeader = request.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        // Conexión y búsqueda
        await connectToDatabase();
        const doc = await Transcription.findOne(
            { _id: id, userUid },
            { text: 1, title: 1, createdAt: 1 }  // sólo devolver los campos relevantes
        );
        if (!doc) {
            return NextResponse.json(
                { error: "No encontrado o sin permiso" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            title: doc.title,
            text: doc.text,
            createdAt: doc.createdAt
        }, { status: 200 });
    } catch (err: any) {
        console.error("GET /api/transcriptions/[id] error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
    const { id } = context.params;
    try {
        // Autenticación
        const authHeader = request.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        // Conexión y borrado
        await connectToDatabase();
        const doc = await Transcription.findOneAndDelete({
            _id: id,
            userUid,
        });

        if (!doc) {
            return NextResponse.json(
                { error: "No encontrado o sin permiso" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        console.error("DELETE /api/transcriptions/[id] error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: 500 }
        );
    }
}
