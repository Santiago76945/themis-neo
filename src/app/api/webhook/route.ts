// src/app/api/webhook/route.ts
// ——————————————————————————————————————————————————————————————————————————————————————————————
import { NextRequest, NextResponse } from "next/server";
// Import as any too
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mercadopago: any = require("mercadopago");

export async function POST(req: NextRequest) {
    // Ensure env vars are present at runtime
    if (!process.env.MP_ACCESS_TOKEN) {
        console.error("Missing MP_ACCESS_TOKEN");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    if (!process.env.MP_WEBHOOK_SECRET) {
        console.error("Missing MP_WEBHOOK_SECRET");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Configure the SDK here (not at top-level)
    mercadopago.configure({
        access_token: process.env.MP_ACCESS_TOKEN,
    });

    // Verify your own webhook secret header
    const receivedSecret = req.headers.get("x-secret-token");
    if (receivedSecret !== process.env.MP_WEBHOOK_SECRET) {
        console.error("Invalid webhook secret", receivedSecret);
        return new NextResponse(null, { status: 401 });
    }

    const topic = req.nextUrl.searchParams.get("topic");
    const id = req.nextUrl.searchParams.get("id");

    if (topic === "payment" && id) {
        try {
            // call the SDK
            const payment = await mercadopago.payment.findById(Number(id));
            // sometimes the SDK nests status under `body.status`, sometimes directly under `status`
            const status =
                payment.body?.status /* v1 style */ || payment.status /* v2 style */;
            if (status === "approved") {
                console.log("✅ PAGO APROBADO:", payment);
                // … aquí tu lógica de acreditación de monedas
            }
        } catch (err) {
            console.error("❌ Error al verificar pago:", err);
        }
    }

    return NextResponse.json({ received: true });
}
