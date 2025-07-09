// src/utils/generateCertificationCode.ts

/**
 * Genera un código aleatorio de longitud fija (por defecto 8 caracteres).
 * Solo incluye letras mayúsculas y dígitos.
 * Función interna, no garantiza unicidad.
 */
export function rawGenerateCertificationCode(length = 8): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        const idx = Math.floor(Math.random() * characters.length);
        code += characters[idx];
    }
    return code;
}

/**
 * Intenta generar un código único comprobando contra la API.
 * Realiza peticiones HEAD a /api/certifications/{code} hasta encontrar uno libre o agotar intentos.
 * @param maxTries Número máximo de intentos (por defecto 5).
 * @param length Longitud del código (por defecto 8).
 * @throws Error si no se encuentra un código libre tras maxTries.
 */
export async function getUniqueCertificationCode(
    maxTries = 5,
    length = 8
): Promise<string> {
    for (let attempt = 1; attempt <= maxTries; attempt++) {
        const candidate = rawGenerateCertificationCode(length);
        try {
            const res = await fetch(`/api/certifications/${candidate}`, { method: 'HEAD' });
            if (res.status === 404) {
                // Código libre
                return candidate;
            }
            // Si responde 200, ya está en uso: seguimos al siguiente intento
        } catch (e) {
            console.warn(`Error verificando código ${candidate}:`, e);
            // En caso de error de red, continuamos intentando
        }
    }
    throw new Error('No se pudo generar un código único tras varios intentos');
}
