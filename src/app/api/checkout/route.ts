// src/app/api/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createPreference } from "@/server/mercadoPago";

interface Package {
    id: string;
    label: string;
    amount: number;
    price: number;
}

const PACKAGES: Package[] = [
    { id: "basic", label: "100 ThemiCoins", amount: 100, price: 1499.99 },
    { id: "popular", label: "500 ThemiCoins", amount: 500, price: 3499.00 },
    { id: "premium", label: "1000 ThemiCoins", amount: 1000, price: 5999.00 },
];

export async function POST(request: NextRequest) {
    try {
        const { bundleId } = await request.json();
        const pkg = PACKAGES.find((p) => p.id === bundleId);
        if (!pkg) {
            return NextResponse.json({ error: "Bundle inválido" }, { status: 400 });
        }

        const { body } = await createPreference([
            { title: pkg.label, quantity: 1, unit_price: pkg.price },
        ]);

        return NextResponse.json({ init_point: body.init_point });
    } catch (err: any) {
        console.error("POST /api/checkout error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: 500 }
        );
    }
}
