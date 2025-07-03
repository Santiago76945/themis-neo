// src/app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
// import again as any so TS can’t try to validate its shape statically
const mercadopago: any = require("mercadopago");

export async function POST(req: NextRequest) {
    // runtime guards
    if (!process.env.MP_ACCESS_TOKEN || !process.env.MP_WEBHOOK_SECRET) {
        console.error("Missing MP_* env vars");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // re-configure here for safety
    mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

    // verify webhook secret
    const received = req.headers.get("x-secret-token");
    if (received !== process.env.MP_WEBHOOK_SECRET) {
        console.error("Webhook: secret mismatch", received);
        return new NextResponse(null, { status: 401 });
    }

    const topic = req.nextUrl.searchParams.get("topic");
    const id = req.nextUrl.searchParams.get("id");
    if (topic === "payment" && id) {
        try {
            // v2 SDK payment lookup
            const payment = await mercadopago.payment.get(Number(id));
            if (payment.body.status === "approved") {
                console.log("✅ PAGO APROBADO:", payment.body);
                // …aquí tu lógica de acreditar coins…
            }
        } catch (e) {
            console.error("❌ Error verifying payment:", e);
        }
    }

    return NextResponse.json({ received: true });
}
