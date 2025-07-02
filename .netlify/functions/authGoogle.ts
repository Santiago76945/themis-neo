// .netlify/functions/authGoogle.ts
import { Handler } from "@netlify/functions";

// Este endpoint está reservado si más adelante quisieras implementar
// un login con OAuth2 puro en Netlify. Por ahora, usamos Firebase en cliente.
export const handler: Handler = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Use Firebase client SDK for Google Sign-In" }),
    };
};
