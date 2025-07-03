// src/app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mercadopago: any = require("mercadopago");

export async function POST(req: NextRequest) {
    // 1) Validar vars de entorno
    if (!process.env.MP_ACCESS_TOKEN || !process.env.MP_WEBHOOK_SECRET) {
        console.error("Missing MP_* env vars");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

    // 2) Verificar secreto del webhook
    const received = req.headers.get("x-secret-token");
    if (received !== process.env.MP_WEBHOOK_SECRET) {
        console.error("Webhook: secret mismatch", received);
        return new NextResponse(null, { status: 401 });
    }

    const topic = req.nextUrl.searchParams.get("topic");
    const id = req.nextUrl.searchParams.get("id");

    if (topic === "payment" && id) {
        try {
            // 3) Obtener datos del pago
            const payment = await mercadopago.payment.get(Number(id));

            if (payment.body.status === "approved") {
                // 4) Extraer metadata
                const { uid, bundle } = payment.body.metadata || {};
                const creditMap: Record<string, number> = {
                    basic: 100,
                    popular: 500,
                    premium: 1000,
                };
                const credit = creditMap[bundle as string] || 0;

                if (uid && credit > 0) {
                    // 5) Conectar y acreditar monedas en MongoDB
                    await connectToDatabase();
                    await User.findOneAndUpdate(
                        { uid },
                        { $inc: { coinsBalance: credit } }
                    );
                    console.log(`✅ Acreditadas ${credit} ThemiCoins al usuario ${uid}`);
                } else {
                    console.warn("Webhook: metadata incompleta", payment.body.metadata);
                }
            }
        } catch (e) {
            console.error("❌ Error verificando/acreditando pago:", e);
        }
    }

    return NextResponse.json({ received: true });
}
