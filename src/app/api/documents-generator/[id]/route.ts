// src/app/api/documents-generator/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import DocumentModel from "@/lib/models/Document";
import { verifyIdToken } from "@/lib/firebaseAdmin";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Autenticación
        const authHeader = req.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        // Conectar a la base de datos
        await connectToDatabase();

        // Obtener documento
        const doc = await DocumentModel.findOne({ _id: id, userUid });
        if (!doc) {
            return NextResponse.json({ error: "No encontrado o sin permiso" }, { status: 404 });
        }

        return NextResponse.json(doc);
    } catch (err: any) {
        console.error("GET /api/documents-generator/[id] error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: err.status || 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Autenticación
        const authHeader = req.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid: userUid } = await verifyIdToken(idToken);

        // Conectar a la base de datos
        await connectToDatabase();

        // Eliminar documento
        const result = await DocumentModel.findOneAndDelete({ _id: id, userUid });
        if (!result) {
            return NextResponse.json({ error: "No encontrado o sin permiso" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("DELETE /api/documents-generator/[id] error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: err.status || 500 }
        );
    }
}