// src/lib/firebaseAdmin.ts

import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as admin from "firebase-admin";

// -- Parámetros de entorno --------------------------------
const decryptKey = process.env.DECRYPT_KEY;                // p.ej. "12345678"
const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET; // "themis-971b4.appspot.com"

if (!decryptKey) {
    throw new Error("DECRYPT_KEY debe estar definido en las variables de entorno");
}
if (!storageBucketName) {
    throw new Error(
        "FIREBASE_STORAGE_BUCKET debe estar definido en las variables de entorno"
    );
}

// -- Ruta al archivo cifrado ------------------------------
const ENC_PATH = path.join(process.cwd(), "serviceAccount.enc");
if (!fs.existsSync(ENC_PATH)) {
    throw new Error(`No se encontró el archivo cifrado en ${ENC_PATH}`);
}

// -- Lectura y desencriptado ------------------------------
const encrypted = fs.readFileSync(ENC_PATH);

// Deriva una clave de 32 bytes a partir de la passphrase numérica
const key = crypto.scryptSync(decryptKey, "salt", 32);

// OpenSSL pone la IV en los primeros 16 bytes del archivo
const iv = encrypted.slice(0, 16);
const ciphertext = encrypted.slice(16);

// Crea el decipher y obtiene el JSON descifrado
const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

let serviceAccount: Record<string, any>;
try {
    serviceAccount = JSON.parse(decrypted.toString("utf-8"));
} catch (err) {
    throw new Error("No se pudo parsear el JSON de credenciales desencriptadas");
}

// -- Inicialización de Firebase Admin --------------------
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucketName,
    });
}

// Exporta el bucket para operaciones con Storage
export const adminStorage = admin.storage().bucket(storageBucketName);

/**
 * Verifica un ID token de Firebase, devolviendo el payload decodificado.
 * Lanza error si el token no es válido.
 */
export async function verifyIdToken(idToken: string) {
    return await admin.auth().verifyIdToken(idToken);
}
