// src/lib/generateDocument.ts

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COINS_PER_TOKEN = parseFloat(process.env.COINS_PER_TOKEN || "0");

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY must be defined in the environment");
}

const ai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Genera un documento a partir de un modelo y datos de usuario usando OpenAI GPT-4o.
 *
 * @param modelContent El contenido del modelo base (prompt template).
 * @param info La información específica proporcionada por el usuario.
 * @returns El texto generado, número de tokens de salida y coste en ThemiCoins.
 */
export default async function generateDocument(
    modelContent: string,
    info: string
): Promise<{
    content: string;
    tokens: number;
    coinsCost: number;
}> {
    // Prompt base con instrucciones claras y límite de tokens
    const basePrompt = `
Debes redactar un documento legal a partir de un modelo base y la información específica proporcionada por el usuario.
No agregues información no incluida explícitamente.
Si el usuario omite datos opcionales, simplemente no los menciones.
Si faltan datos esenciales para la estructura del modelo, colócalos entre corchetes con la indicación “[completar]”.
Nunca inventes nombres, fechas ni hechos. Mantén un estilo claro, profesional y objetivo.
Además, intenta usar una cantidad de tokens similar a la longitud del modelo base (el prompt inicial) y nunca excedas el doble de esa longitud.
`.trim();

    // Construir los mensajes en el formato esperado
    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: basePrompt },
        {
            role: "user",
            content: `--- Modelo base ---\n${modelContent}\n\n--- Información del usuario ---\n${info}`,
        },
    ];

    // Llamada a OpenAI Chat Completion usando GPT-4o
    const response = await ai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.2,
    });

    // Extraer el contenido generado
    const content = response.choices?.[0]?.message?.content?.trim() || "";

    // Tokens de prompt y de respuesta
    const promptTokens = response.usage?.prompt_tokens ?? 0;
    const completionTokens = response.usage?.completion_tokens ?? 0;
    const totalTokens = response.usage?.total_tokens ?? (promptTokens + completionTokens);

    // Cálculo de coste en ThemiCoins basado en todos los tokens utilizados
    const coinsCost = Math.ceil(totalTokens * COINS_PER_TOKEN);

    return {
        content,
        tokens: completionTokens,
        coinsCost,
    };
}
