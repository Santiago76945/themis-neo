// src/server/mercadoPago.ts

// 1) Requerimos el módulo y, si viene como namespace, tomamos `.default`
const mpPkg: any = require("mercadopago");
const mercadopago: any = mpPkg.default ?? mpPkg;

if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN must be defined in environment variables");
}
if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL must be defined in environment variables");
}

// 2) Ahora sí configure existe
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
});

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
