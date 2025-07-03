// src/app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";

// Importar con require y tiparlo como any
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mercadopago: any = require("mercadopago");

if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN must be defined");
}
if (!process.env.MP_WEBHOOK_SECRET) {
    throw new Error("MP_WEBHOOK_SECRET must be defined");
}

// Configuramos el SDK de Mercado Pago
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
});

export async function POST(req: NextRequest) {
    // Verificar la clave secreta del webhook
    const receivedSecret = req.headers.get("x-secret-token");
    const expectedSecret = process.env.MP_WEBHOOK_SECRET;
    if (receivedSecret !== expectedSecret) {
        console.error("Webhook: secreto inválido", receivedSecret);
        return new NextResponse(null, { status: 401 });
    }

    const topic = req.nextUrl.searchParams.get("topic");
    const id = req.nextUrl.searchParams.get("id");

    if (topic === "payment" && id) {
        try {
            const payment = await mercadopago.payment.findById(Number(id));
            if (payment.body.status === "approved") {
                console.log("✅ PAGO APROBADO:", payment.body);
                // Aquí tu lógica de acreditación de monedas…
            }
        } catch (err) {
            console.error("❌ Error al verificar pago:", err);
        }
    }

    return NextResponse.json({ received: true });
}
