// src/app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
const mercadopago: any = require("mercadopago");

export async function POST(req: NextRequest) {
    // Validar variables de entorno
    if (!process.env.MP_ACCESS_TOKEN || !process.env.MP_WEBHOOK_SECRET) {
        console.error("Missing MP_* env vars");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

    // Verificar secreto
    const received = req.headers.get("x-secret-token");
    if (received !== process.env.MP_WEBHOOK_SECRET) {
        console.error("Webhook: secret mismatch", received);
        return new NextResponse(null, { status: 401 });
    }

    const topic = req.nextUrl.searchParams.get("topic");
    const id = req.nextUrl.searchParams.get("id");
    if (topic === "payment" && id) {
        try {
            // Obtener pago
            const payment = await mercadopago.payment.get(Number(id));

            if (payment.body.status === "approved") {
                // Extraer metadata
                const { uid, bundleId } = payment.body.metadata || {};
                const creditMap: Record<string, number> = {
                    basic: 100,
                    popular: 500,
                    premium: 1000,
                };
                const credit = creditMap[bundleId as string] ?? 0;

                if (uid && credit > 0) {
                    // Acreditar en BD
                    await connectToDatabase();
                    const user = await User.findOneAndUpdate(
                        { uid },
                        { $inc: { coinsBalance: credit } },
                        { new: true }
                    );
                    console.log(`🪙 Acreditados ${credit} coins a uid=${uid}. Nuevo saldo:`, user?.coinsBalance);
                } else {
                    console.warn("Webhook: metadata incompleta", payment.body.metadata);
                }
            }
        } catch (e) {
            console.error("❌ Error verifying payment:", e);
        }
    }

    return NextResponse.json({ received: true });
}
