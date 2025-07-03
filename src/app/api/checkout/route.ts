// src/app/api/checkout/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

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

// Instanciamos el cliente solo una vez
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
    try {
        const { bundleId } = (await request.json()) as { bundleId?: string };
        const pkg = PACKAGES.find((p) => p.id === bundleId);
        if (!pkg) {
            return NextResponse.json({ error: "Bundle inválido" }, { status: 400 });
        }

        // Creamos la preferencia usando la nueva clase Preference
        const preferenceClient = new Preference(mpClient);
        const preferenceResponse = await preferenceClient.create({
            body: {
                items: [
                    {
                        id: pkg.id,
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
            },
        });

        // En v2, `create()` devuelve ya el objeto con init_point, no dentro de .body
        const init_point = preferenceResponse.init_point;
        return NextResponse.json({ init_point });
    } catch (err: any) {
        console.error("POST /api/checkout error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: 500 }
        );
    }
}
