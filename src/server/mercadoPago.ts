// src/server/mercadoPago.ts

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// Validar ENV
if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN must be defined");
}

// Instanciar SDK
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

// Exportar clientes
export const preferenceClient = new Preference(mpClient);
export const paymentClient = new Payment(mpClient);

/**
 * Crea una preferencia y devuelve el objeto completo de MP (incluye init_point)
 */
export async function createPreference(data: any): Promise<any> {
    return await preferenceClient.create({ body: data });
}
