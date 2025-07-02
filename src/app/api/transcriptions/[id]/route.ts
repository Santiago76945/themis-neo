// src/app/api/transcriptions/[id]/route.ts

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Transcription from "@/lib/models/Transcription";
import { verifyIdToken } from "@/lib/firebaseAdmin";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        // 1. Autenticación
        const authHeader = request.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        // 2. Borrar sólo si pertenece al usuario
        await connectToDatabase();
        const doc = await Transcription.findOneAndDelete({
            _id: params.id,
            userUid,
        });

        if (!doc) {
            return NextResponse.json({ error: "No encontrado o sin permiso" }, { status: 404 });
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
