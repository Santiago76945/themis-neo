// src/app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
// Usamos require para evitar que TS infiera un tipo restringido
const mercadopago = require("mercadopago");

if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN must be defined");
}

// Configuramos el SDK de Mercado Pago
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
});

export async function POST(req: NextRequest) {
    // Parseamos el cuerpo y los parámetros de consulta
    const body = await req.json();
    const topic = req.nextUrl.searchParams.get("topic");
    const id = req.nextUrl.searchParams.get("id");

    if (topic === "payment" && id) {
        try {
            // Verificamos el pago
            const payment = await mercadopago.payment.findById(Number(id));
            if (payment.body.status === "approved") {
                // Aquí pones tu lógica de entrega de monedas, actualización de usuario, etc.
                console.log("✅ PAGO APROBADO:", payment.body);
            }
        } catch (err) {
            console.error("❌ Error al verificar pago:", err);
        }
    }

    return NextResponse.json({ received: true });
}
