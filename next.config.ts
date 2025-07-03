// next.config.js

/** @type {import('next').NextConfig} */
module.exports = {
    // variables que **sí** necesitas en el cliente
    env: {
        NEXT_PUBLIC_COINS_PER_TOKEN: process.env.COINS_PER_TOKEN,
    },
    publicRuntimeConfig: {
        MP_PUBLIC_KEY: process.env.MP_PUBLIC_KEY,  // clave pública: OK exponerla
    },
    // NO pongas aquí OPENAI_API_KEY ni MP_ACCESS_TOKEN
};
