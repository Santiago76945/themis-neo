// src/app/api/webhook/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { paymentClient } from "@/server/mercadoPago";
import { createHmac } from "crypto";

const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

function verifySignature(
    signatureHeader: string | null,
    requestId: string | null,
    resourceId: string | null
): boolean {
    if (!WEBHOOK_SECRET || !signatureHeader || !requestId || !resourceId) {
        console.error("Webhook verification failed: missing data", {
            hasSecret: !!WEBHOOK_SECRET,
            signatureHeader,
            requestId,
            resourceId,
        });
        return false;
    }

    const parts = signatureHeader.split(",");
    const ts = parts.find((p) => p.startsWith("ts="))?.split("=")[1];
    const v1 = parts.find((p) => p.startsWith("v1="))?.split("=")[1];
    if (!ts || !v1) {
        console.error("Invalid signature header format", signatureHeader);
        return false;
    }

    const manifest = `id:${resourceId};request-id:${requestId};ts:${ts};`;
    const expected = createHmac("sha256", WEBHOOK_SECRET)
        .update(manifest)
        .digest("hex");

    if (expected !== v1) {
        console.error("Signature mismatch", { expected, received: v1, manifest });
        return false;
    }

    return true;
}

export async function POST(req: NextRequest) {
    // 1) Validar env vars
    if (!process.env.MP_ACCESS_TOKEN || !WEBHOOK_SECRET) {
        console.error("Missing MP_ACCESS_TOKEN or MP_WEBHOOK_SECRET");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // 2) Leer raw body y headers
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");

    let body: any;
    try {
        body = JSON.parse(rawBody);
    } catch {
        console.error("Invalid JSON payload");
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const resourceId = body.data?.id?.toString() || body.id?.toString();

    // 3) Verificar firma HMAC
    if (!verifySignature(signatureHeader, requestId, resourceId)) {
        return new NextResponse(null, { status: 401 });
    }

    // 4) Procesar evento
    const topic = body.type || body.topic;
    const id = Number(resourceId);
    if (topic === "payment" && id) {
        try {
            console.log("🔔 Webhook recibido:", { topic, id, metadata: body.data?.metadata });

            // Llamada corregida al SDK: usar { id } en vez de { payment_id }
            const mpRes: any = await paymentClient.get({ id });
            const payment = mpRes.body ?? mpRes;
            console.log("Detalle pago:", payment);

            if (payment.status === "approved") {
                const { uid, bundleId } = payment.metadata || {};
                const creditMap: Record<string, number> = {
                    basic: 100,
                    popular: 500,
                    premium: 1000,
                };
                const credit = creditMap[String(bundleId)] || 0;

                if (uid && credit > 0) {
                    await connectToDatabase();
                    const user = await User.findOneAndUpdate(
                        { uid },
                        { $inc: { coinsBalance: credit } },
                        { new: true }
                    );
                    console.log(`✅ Acreditadas ${credit} ThemiCoins a uid=${uid}. Saldo:`, user?.coinsBalance);
                } else {
                    console.warn("Webhook: metadata incompleta", payment.metadata);
                }
            } else {
                console.log("Payment not approved:", payment.status);
            }
        } catch (e) {
            console.error("❌ Error acreditando pago:", e);
        }
    }

    // 5) Siempre responder 200
    return NextResponse.json({ received: true });
}
