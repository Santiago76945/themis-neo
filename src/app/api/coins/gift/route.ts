// src/app/api/coins/gift/route.ts

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";

// Secreto de administrador definido en .env.local
const ADMIN_SECRET = process.env.ADMIN_GIFT_SECRET;

export async function POST(request: Request) {
    // Verificar secreto en cabecera
    const auth = request.headers.get("x-admin-secret");
    if (auth !== ADMIN_SECRET) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { uniqueCode, amount } = await request.json();
    if (typeof uniqueCode !== "string" || typeof amount !== "number" || amount <= 0) {
        return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    await connectToDatabase();
    // Buscar por uniqueCode en lugar de UID
    const user = await User.findOneAndUpdate(
        { uniqueCode: uniqueCode.toUpperCase() },
        { $inc: { coinsBalance: amount } },
        { new: true }
    );

    if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
        message: `Se añadieron ${amount} coins al usuario con código ${uniqueCode}`,
        coins: user.coinsBalance,
    });
}
