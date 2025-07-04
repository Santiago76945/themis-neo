// src/app/api/checkout/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebaseAdmin";
import { createPreference } from "@/server/mercadoPago";

interface Package {
    id: string;
    label: string;
    amount: number;
    price: number;
}

const PACKAGES: Package[] = [
    { id: "basic", label: "100 ThemiCoins", amount: 100, price: 1499.99 },
    { id: "popular", label: "500 ThemiCoins", amount: 500, price: 3499.0 },
    { id: "premium", label: "1000 ThemiCoins", amount: 1000, price: 5999.0 },
];

export async function POST(request: NextRequest) {
    try {
        // 1) Verificar ID token y extraer UID
        const authHeader = request.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const { uid } = await verifyIdToken(idToken);

        // 2) Validar bundleId recibido
        const { bundleId } = (await request.json()) as { bundleId?: string };
        const pkg = PACKAGES.find(p => p.id === bundleId);
        if (!pkg) {
            return NextResponse.json({ error: "Bundle inválido" }, { status: 400 });
        }

        // 3) Crear preferencia en MP
        const mpRes: any = await createPreference({
            items: [{
                id: pkg.id,
                title: pkg.label,
                quantity: 1,
                unit_price: pkg.price,
            }],
            metadata: { uid, bundleId: pkg.id },
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
                failure: `${process.env.NEXT_PUBLIC_BASE_URL}/failure`,
                pending: `${process.env.NEXT_PUBLIC_BASE_URL}/pending`,
            },
            auto_return: "approved",
        });

        // 4) Extraer init_point y devolver
        const init_point: string = String(mpRes.init_point ?? mpRes.sandbox_init_point);
        return NextResponse.json({ init_point });
    } catch (err: any) {
        console.error("POST /api/checkout error:", err);
        return NextResponse.json(
            { error: err.message || "Error interno" },
            { status: 500 }
        );
    }
}
