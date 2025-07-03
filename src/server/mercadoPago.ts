// src/server/mercadoPago.ts

// (This lives under src/server so it never enters your client bundle.)

// import as a plain JS module
const mercadopago: any = require("mercadopago");

if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN must be defined in environment variables");
}
if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL must be defined in environment variables");
}

// Configure once at runtime
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
    // preferencia v2 SDK: mercadopago.preferences.create(...)
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
