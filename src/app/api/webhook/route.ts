// src/app/api/webhook/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { paymentClient } from "@/server/mercadoPago";

/* ---------- Tipos auxiliares ---------- */
interface MercadoPagoPayment {
    status: string;
    metadata?: {
        uid?: string;
        bundleId?: "basic" | "popular" | "premium";
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

/* ---------- Helpers ---------- */
function verifyMpSignature(
    signatureHeader: string | null,
    paymentId: string,
    secret: string,
    requestId: string | null
): boolean {
    if (!signatureHeader) return false;

    // x-signature: ts=...,v1=...
    const parts = Object.fromEntries(
        signatureHeader.split(",").map((p) => {
            const [k, v] = p.trim().split("=");
            return [k, v];
        })
    ) as Record<string, string>;

    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    // Cadena que Mercado Pago firma
    const manifest = `id:${paymentId};request-id:${requestId ?? ""};ts:${ts};`;

    const expected = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

    // timing-safe compare
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

/* ---------- Handler ---------- */
export async function POST(req: NextRequest) {
    /* 1) Validar env vars */
    if (!process.env.MP_ACCESS_TOKEN || !process.env.MP_WEBHOOK_SECRET) {
        console.error("Missing MP_* env vars");
        return NextResponse.json(
            { error: "Server misconfigured" },
            { status: 500 }
        );
    }

    /* 2) Parsear body */
    const body = await req.json();
    const topic = body.type || body.topic;
    const id = String(body.data?.id || body.id || "");
    if (!id) return NextResponse.json({ received: true });

    /* 3) Verificar firma */
    const signature =
        req.headers.get("x-signature") ??
        req.headers.get("x-mercadopago-signature");
    const requestId = req.headers.get("x-request-id");

    if (
        !verifyMpSignature(
            signature,
            id,
            process.env.MP_WEBHOOK_SECRET,
            requestId
        )
    ) {
        console.error("Webhook: invalid signature", signature);
        return new NextResponse(null, { status: 401 });
    }

    /* 4) Procesar pagos aprobados */
    if (topic === "payment") {
        try {
            // evitamos genéricos para que TS no marque error
            const mpRes: any = await (paymentClient as any).get(Number(id));
            const payment: MercadoPagoPayment =
                mpRes.body ?? mpRes;

            if (payment.status === "approved") {
                const { uid, bundleId } = payment.metadata ?? {};
                const creditMap = { basic: 100, popular: 500, premium: 1000 } as const;
                const credit =
                    bundleId && bundleId in creditMap
                        ? creditMap[bundleId as keyof typeof creditMap]
                        : 0;

                if (uid && credit > 0) {
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

    /* 5) Responder siempre 200 a MP */
    return NextResponse.json({ received: true });
}
