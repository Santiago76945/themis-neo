// src/app/api/checkout/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

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
        const { bundleId } = (await request.json()) as { bundleId?: string };
        const pkg = PACKAGES.find((p) => p.id === bundleId);
        if (!pkg) {
            return NextResponse.json({ error: "Bundle inválido" }, { status: 400 });
        }

        // Import dinámico del SDK de Mercado Pago
        const mpModule = await import("mercadopago");
        // Forzamos a any para esquivar errores de TS sobre configure/preferences
        const mercadopago: any = mpModule.default ?? mpModule;

        if (!process.env.MP_ACCESS_TOKEN) {
            console.error("MP_ACCESS_TOKEN no definido");
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }
        if (!process.env.NEXT_PUBLIC_BASE_URL) {
            console.error("NEXT_PUBLIC_BASE_URL no definido");
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }

        // Configuramos el SDK en runtime
        mercadopago.configure({
            access_token: process.env.MP_ACCESS_TOKEN,
        });

        // Creamos la preferencia
        const preferenceResponse = await mercadopago.preferences.create({
            items: [
                {
                    title: pkg.label,
                    quantity: 1,
                    unit_price: pkg.price,
                },
            ],
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
                failure: `${process.env.NEXT_PUBLIC_BASE_URL}/failure`,
                pending: `${process.env.NEXT_PUBLIC_BASE_URL}/pending`,
            },
            auto_return: "approved",
        });

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
