// src/app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
// Importar con require y tiparlo como any
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mercadopago: any = require("mercadopago");

export async function POST(req: NextRequest) {
    // —— Validaciones en runtime ——
    if (!process.env.MP_ACCESS_TOKEN) {
        console.error("Falta MP_ACCESS_TOKEN en entorno de ejecución");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    if (!process.env.MP_WEBHOOK_SECRET) {
        console.error("Falta MP_WEBHOOK_SECRET en entorno de ejecución");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Configuramos el SDK **aquí**, no al importar
    mercadopago.configure({
        access_token: process.env.MP_ACCESS_TOKEN,
    });

    // Verificar la clave secreta del webhook
    const receivedSecret = req.headers.get("x-secret-token");
    const expectedSecret = process.env.MP_WEBHOOK_SECRET;
    if (receivedSecret !== expectedSecret) {
        console.error("Webhook: secreto inválido", receivedSecret);
        return new NextResponse(null, { status: 401 });
    }

    // Parsear parámetros
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
