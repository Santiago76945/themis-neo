// src/app/api/webhook/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mercadopago: any = require("mercadopago");

// Configurar Mercado Pago al cargar el módulo
if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN must be defined in environment variables");
}
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
});

// Mapa de crédito según bundleId
const CREDIT_MAP: Record<string, number> = {
    basic: 100,
    popular: 500,
    premium: 1000,
};

export async function POST(req: NextRequest) {
    // Validar secreto del webhook
    const receivedSecret = req.headers.get("x-secret-token");
    if (receivedSecret !== process.env.MP_WEBHOOK_SECRET) {
        console.error("Webhook secret mismatch", receivedSecret);
        return new NextResponse(null, { status: 401 });
    }

    // Parsear payload JSON
    const body = await req.json();
    const topic = body.type || body.topic;
    const id = body.data?.id || body.id;
    const metadata = body.data?.metadata;

    if (topic === "payment" && id && metadata?.uid && metadata?.bundleId) {
        try {
            console.log("🔔 Webhook received:", { topic, id, metadata });

            // Obtener detalle del pago
            const paymentResponse = await mercadopago.payment.get(Number(id));
            const payment = paymentResponse.body;

            if (payment.status === "approved") {
                const { uid, bundleId } = metadata;
                const credit = CREDIT_MAP[bundleId as string] || 0;

                if (credit > 0) {
                    // Conectar a BD y acreditar monedas
                    await connectToDatabase();
                    const user = await User.findOneAndUpdate(
                        { uid },
                        { $inc: { coinsBalance: credit } },
                        { new: true }
                    );
                    console.log(
                        `✅ Credited ${credit} ThemiCoins to uid=${uid}. New balance:`,
                        user?.coinsBalance
                    );
                } else {
                    console.warn("Unknown bundleId or zero credit:", bundleId);
                }
            } else {
                console.log("Payment not approved:", payment.status);
            }
        } catch (error: any) {
            console.error("❌ Error processing webhook:", error);
        }
    }

    // Responder siempre 200 para Mercado Pago
    return NextResponse.json({ received: true });
}
