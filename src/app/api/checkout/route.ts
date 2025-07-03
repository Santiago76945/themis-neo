// src/app/api/checkout/route.ts

import { NextResponse } from "next/server";
import { createPreference } from "@/server/mercadoPago";

interface Package {
    id: string;
    label: string;
    amount: number;
    price: number;
}

// Mismo catálogo que en el frontend, pero precio como número
const PACKAGES: Package[] = [
    { id: "basic", label: "100 ThemiCoins", amount: 100, price: 1499.99 },
    { id: "popular", label: "500 ThemiCoins", amount: 500, price: 3499.00 },
    { id: "premium", label: "1000 ThemiCoins", amount: 1000, price: 5999.00 },
];

export async function POST(request: Request) {
    try {
        // 1. Parsear el body
        const { bundleId } = await request.json();
        const pkg = PACKAGES.find((p) => p.id === bundleId);
        if (!pkg) {
            return NextResponse.json({ error: "Bundle inválido" }, { status: 400 });
        }

        // 2. Crear la preferencia de pago
        const preferenceResponse = await createPreference([
            {
                title: pkg.label,
                quantity: 1,
                unit_price: pkg.price,
            },
        ]);

        // 3. Devolver al cliente la URL de checkout
        const init_point = preferenceResponse.body.init_point;
        return NextResponse.json({ init_point });
    } catch (err: any) {
        console.error("POST /api/checkout error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: 500 }
        );
    }
}
