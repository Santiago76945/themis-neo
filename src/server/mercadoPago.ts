// src/server/mercadoPago.ts
// ——————————————————————————————————————————————————————————————————————————————————————————————
// Import with require and cast to any to avoid TS complaints about the v2 SDK types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mercadopago: any = require("mercadopago");

if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN must be defined in environment variables");
}
if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL must be defined in environment variables");
}

// Configure the SDK once
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
});

/**
 * Create a Mercado Pago payment preference.
 */
export async function createPreference(
    items: { title: string; quantity: number; unit_price: number }[]
) {
    return await mercadopago.preferences.create({
        items,
        back_urls: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/failure`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL}/pending`,
        },
        auto_return: "approved",
    });
}
