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
        // 1. Leer bundleId del body
        const { bundleId } = (await request.json()) as { bundleId?: string };
        const pkg = PACKAGES.find((p) => p.id === bundleId);
        if (!pkg) {
            return NextResponse.json({ error: "Bundle inválido" }, { status: 400 });
        }

        // 2. Importar SDK de Mercado Pago en runtime (Node)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mpPkg: any = require("mercadopago");
        const mercadopago: any = mpPkg.default ?? mpPkg;

        // 3. Validaciones de entorno
        if (!process.env.MP_ACCESS_TOKEN) {
            console.error("MP_ACCESS_TOKEN no definido");
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }
        if (!process.env.NEXT_PUBLIC_BASE_URL) {
            console.error("NEXT_PUBLIC_BASE_URL no definido");
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }

        // 4. Configurar SDK
        mercadopago.configure({
            access_token: process.env.MP_ACCESS_TOKEN,
        });

        // 5. Crear preferencia de pago
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
            // metadata: { bundle: pkg.id }  // si luego quieres recuperar el bundle en el webhook
        });

        // 6. Devolver init_point
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

