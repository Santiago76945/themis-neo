// src/lib/firebaseAdmin.ts

import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as admin from "firebase-admin";

// -- Parámetros de entorno --------------------------------
const decryptKey = process.env.DECRYPT_KEY!;                // p.ej. "uWqG4vZ0X2lHbT7P8vJ3xY4rS6dZ9tH2kV8y1L4P3M="
const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET!; // "themis-971b4.appspot.com"
const ENC_PATH = path.join(process.cwd(), "serviceAccount.enc");

// -- Logs de verificación (temp) --------------------------
console.log("🛠️ DECRYPT_KEY (length):", decryptKey?.length);
console.log("🛠️ ENC_PATH exists?", fs.existsSync(ENC_PATH));

// -- Validaciones iniciales -------------------------------
if (!decryptKey) {
    throw new Error("DECRYPT_KEY debe estar definido en las variables de entorno");
}
if (!storageBucketName) {
    throw new Error(
        "FIREBASE_STORAGE_BUCKET debe estar definido en las variables de entorno"
    );
}
if (!fs.existsSync(ENC_PATH)) {
    throw new Error(`No se encontró el archivo cifrado en ${ENC_PATH}`);
}

let serviceAccount: Record<string, any>;

try {
    // -- Lectura y desencriptado ------------------------------
    const encrypted = fs.readFileSync(ENC_PATH);

    // Verificar cabecera y extraer salt
    const header = encrypted.slice(0, 8).toString("ascii");
    if (header !== "Salted__") {
        throw new Error("Formato de fichero cifrado inválido: cabecera no encontrada");
    }
    const salt = encrypted.slice(8, 16);

    // Derivar key e IV con PBKDF2
    const ITERATIONS = 100_000;
    const KEY_LEN = 32;
    const IV_LEN = 16;
    const keyIv = crypto.pbkdf2Sync(
        decryptKey,
        salt,
        ITERATIONS,
        KEY_LEN + IV_LEN,
        "sha256"
    );
    const key = keyIv.slice(0, KEY_LEN);
    const iv = keyIv.slice(KEY_LEN);

    // Cifrado AES-256-CBC
    const ciphertext = encrypted.slice(16);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    // Parsear JSON
    const jsonString = decrypted.toString("utf-8");
    console.log("🛠️ JSON desencriptado snippet:", jsonString.slice(0, 50) + "...");
    serviceAccount = JSON.parse(jsonString);

} catch (err: any) {
    console.error("❌ Error al desencriptar o parsear las credenciales:", err.message);
    throw err;
}

// -- Inicialización de Firebase Admin --------------------
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucketName,
    });
}

// -- Exportaciones ----------------------------------------
export const adminStorage = admin.storage().bucket(storageBucketName);

export async function verifyIdToken(idToken: string) {
    return await admin.auth().verifyIdToken(idToken);
}
