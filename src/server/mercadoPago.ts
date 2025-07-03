// src/server/mercadoPago.ts
// ————————————————————————————————————————————————————————————————
// 1) Importamos con require y lo tipamos como `any`
//    para evitar conflictos con la declaración de tipos oficial.
// 2) Mantenemos este archivo bajo src/server para que Next.js
//    lo considere solo en el servidor.
// ————————————————————————————————————————————————————————————————

const mercadopago: any = require("mercadopago");

if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN must be defined in environment variables");
}
if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL must be defined in environment variables");
}

// Configuramos el SDK de Mercado Pago (solo en server)
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
});

/**
 * Crea una preferencia de pago en Mercado Pago.
 * @param items Array de ítems con { title, quantity, unit_price }
 */
export async function createPreference(
    items: { title: string; quantity: number; unit_price: number }[]
) {
    return mercadopago.preferences.create({
        items,
        back_urls: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/failure`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL}/pending`,
        },
        auto_return: "approved",
    });
}
