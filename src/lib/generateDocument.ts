// src/lib/generateDocument.ts

import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COINS_PER_TOKEN = parseFloat(process.env.COINS_PER_TOKEN || "0");

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY must be defined in the environment");
}

const ai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Genera un documento a partir de un modelo y datos de usuario usando OpenAI.
 *
 * @param modelContent El contenido del modelo base (prompt template).
 * @param info La información específica proporcionada por el usuario.
 * @returns El texto generado, número de tokens y coste en ThemiCoins.
 */
export default async function generateDocument(
    modelContent: string,
    info: string
): Promise<{
    content: string;
    tokens: number;
    coinsCost: number;
}> {
    // Prompt base con instrucciones claras
    const basePrompt = `
Debes redactar un documento legal a partir de un modelo base y la información específica proporcionada por el usuario.
No agregues información no incluida explícitamente.
Si el usuario omite datos opcionales, simplemente no los menciones.
Si faltan datos esenciales para la estructura del modelo, colócalos entre corchetes con la indicación “[completar]”.
Nunca inventes nombres, fechas ni hechos. Mantén un estilo claro, profesional y objetivo.
`;

    // Montar prompt completo
    const prompt = `
${basePrompt}

--- Modelo base ---
${modelContent}

--- Información del usuario ---
${info}
`;

    // Llamada a OpenAI Chat Completion
    const response = await ai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: basePrompt.trim() },
            { role: "user", content: prompt.trim() },
        ],
        temperature: 0.2,
    });

    const content = response.choices?.[0]?.message?.content?.trim() || "";

    // Conteo de tokens aproximado (palabras)
    const tokens = content.split(/\s+/).filter(Boolean).length;

    // Cálculo de coste
    const coinsCost = Math.ceil(tokens * COINS_PER_TOKEN);

    return {
        content,
        tokens,
        coinsCost,
    };
}
