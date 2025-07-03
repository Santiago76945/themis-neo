// src/app/api/webhook/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { paymentClient } from "@/server/mercadoPago";

export async function POST(req: NextRequest) {
    // 1) Validar variables de entorno
    if (!process.env.MP_ACCESS_TOKEN || !process.env.MP_WEBHOOK_SECRET) {
        console.error("Missing MP_* env vars");
        return NextResponse.json(
            { error: "Server misconfigured" },
            { status: 500 }
        );
    }

    // 2) Verificar secreto del webhook
    const received = req.headers.get("x-secret-token");
    if (received !== process.env.MP_WEBHOOK_SECRET) {
        console.error("Webhook: secret mismatch", received);
        return new NextResponse(null, { status: 401 });
    }

    // 3) Parsear payload
    const body = await req.json();
    const topic = body.type || body.topic;
    const id = body.data?.id || body.id;

    if (topic === "payment" && id) {
        try {
            console.log("🔔 Webhook recibido:", { topic, id, metadata: body.data?.metadata });

            // 4) Obtener detalle del pago usando el SDK nuevo
            // Forzamos any para saltear chequeo de tipos en TS
            const mpRes: any = await (paymentClient as any).get(Number(id));
            const payment = mpRes.body ?? mpRes;

            if (payment.status === "approved") {
                // 5) Extraer metadata y calcular crédito
                const { uid, bundleId } = payment.metadata || {};
                const creditMap: Record<string, number> = { basic: 100, popular: 500, premium: 1000 };
                const credit = creditMap[bundleId as string] || 0;

                if (uid && credit > 0) {
                    // 6) Conectar a DB y acreditar monedas
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
                console.log("Payment status not approved:", payment.status);
            }
        } catch (e) {
            console.error("❌ Error verificando/acreditando pago:", e);
        }
    }

    // 7) Responder siempre 200 para MP
    return NextResponse.json({ received: true });
}
