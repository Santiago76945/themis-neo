// src/app/api/documents/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/db";
import GeneratedDocument from "@/lib/models/Document";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const { uid } = await verifyIdToken(token);

        const { id } = params;
        await connectToDatabase();

        const doc = await GeneratedDocument.findOne(
            { _id: id, userUid: uid },
            { content: 1, model: 1, info: 1, tokens: 1, coinsCost: 1, createdAt: 1 }
        );
        if (!doc) {
            return NextResponse.json(
                { error: "No encontrado o sin permiso" },
                { status: 404 }
            );
        }
        return NextResponse.json(doc, { status: 200 });
    } catch (err: any) {
        console.error("GET /api/documents/[id] error:", err);
        const isAuth = /not authorized|auth\//i.test(err.message);
        return NextResponse.json(
            { error: err.message },
            { status: isAuth ? 401 : 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        const { uid } = await verifyIdToken(token);

        const { id } = params;
        await connectToDatabase();

        const doc = await GeneratedDocument.findOneAndDelete({
            _id: id,
            userUid: uid,
        });
        if (!doc) {
            return NextResponse.json(
                { error: "No encontrado o sin permiso" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        console.error("DELETE /api/documents/[id] error:", err);
        const isAuth = /not authorized|auth\//i.test(err.message);
        return NextResponse.json(
            { error: err.message },
            { status: isAuth ? 401 : 500 }
        );
    }
}
