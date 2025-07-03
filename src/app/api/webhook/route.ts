// src/app/api/webhook/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mercadopago: any = require("mercadopago");

export async function POST(req: NextRequest) {
    // 1) Validar variables de entorno
    if (!process.env.MP_ACCESS_TOKEN || !process.env.MP_WEBHOOK_SECRET) {
        console.error("Missing MP_* env vars");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    // Configurar SDK
    mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

    // 2) Verificar secreto del webhook
    const received = req.headers.get("x-secret-token");
    if (received !== process.env.MP_WEBHOOK_SECRET) {
        console.error("Webhook: secret mismatch", received);
        return new NextResponse(null, { status: 401 });
    }

    // 3) Parsear payload JSON (MP envía el evento en el body)
    const body = await req.json();
    const topic = body.type || body.topic;
    const id = body.data?.id || body.id;

    if (topic === "payment" && id) {
        try {
            console.log("🔔 Webhook recibido:", { topic, id, metadata: body.data?.metadata });
            // Obtener detalle del pago
            const paymentResponse = await mercadopago.payment.get(Number(id));
            const payment = paymentResponse.body;

            if (payment.status === "approved") {
                // 4) Extraer metadata alineada con checkout
                const { uid, bundleId } = payment.metadata || {};
                const creditMap: Record<string, number> = {
                    basic: 100,
                    popular: 500,
                    premium: 1000,
                };
                const credit = creditMap[bundleId as string] || 0;

                if (uid && credit > 0) {
                    // 5) Conectar a BD y acreditar monedas
                    await connectToDatabase();
                    const user = await User.findOneAndUpdate(
                        { uid },
                        { $inc: { coinsBalance: credit } },
                        { new: true }
                    );
                    console.log(
                        `✅ Acreditadas ${credit} ThemiCoins a uid=${uid}. Nuevo saldo:`,
                        user?.coinsBalance
                    );
                } else {
                    console.warn("Webhook: metadata incompleta", payment.metadata);
                }
            } else {
                console.log("Payment status no approved:", payment.status);
            }
        } catch (e) {
            console.error("❌ Error verificando/acreditando pago:", e);
        }
    }

    // 6) Responder siempre 200 para MP
    return NextResponse.json({ received: true });
}
