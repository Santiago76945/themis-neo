// src/server/mercadoPago.ts

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// 1) Verificamos vars de entorno
if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN must be defined");
}
if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL must be defined");
}

// 2) Instanciamos el SDK
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

// 3) Creamos los clientes
export const preferenceClient = new Preference(mpClient);
export const paymentClient = new Payment(mpClient);

/**
 * Crea una preferencia y devuelve el resultado de MP
 */
export async function createPreference(data: any): Promise<any> {
    // Forzamos any para evitar chequeos de tipos en TS
    const mpRes: any = await preferenceClient.create({ body: data });
    // Devuelve el objeto entero (contiene init_point)
    return mpRes;
}
