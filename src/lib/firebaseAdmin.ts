// src/lib/firebaseAdmin.ts

import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as admin from "firebase-admin";

const decryptKey = process.env.DECRYPT_KEY!;
const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET!;
const ENC_PATH = path.join(process.cwd(), "serviceAccount.enc");

if (!fs.existsSync(ENC_PATH)) {
    throw new Error(`No se encontró el archivo cifrado en ${ENC_PATH}`);
}

// 1) Leer todo el buffer
const encrypted = fs.readFileSync(ENC_PATH);

// 2) Validar y extraer salt
const header = encrypted.slice(0, 8).toString("ascii");
if (header !== "Salted__") {
    throw new Error("Formato de fichero cifrado inválido");
}
const salt = encrypted.slice(8, 16);

// 3) Derivar key+iv con PBKDF2 (misma iteración que usaste al cifrar)
const ITERATIONS = 100_000;
const KEY_LEN = 32;   // AES-256
const IV_LEN = 16;    // CBC
const keyIv = crypto.pbkdf2Sync(
    decryptKey,
    salt,
    ITERATIONS,
    KEY_LEN + IV_LEN,
    "sha256"
);
const key = keyIv.slice(0, KEY_LEN);
const iv = keyIv.slice(KEY_LEN);

// 4) Descifrar
const ciphertext = encrypted.slice(16);
const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
]);

// 5) Parsear JSON
let serviceAccount: Record<string, any>;
try {
    serviceAccount = JSON.parse(decrypted.toString("utf-8"));
} catch {
    throw new Error("No se pudo parsear el JSON desencriptado");
}

// 6) Inicializar Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucketName,
    });
}

export const adminStorage = admin.storage().bucket(storageBucketName);
export async function verifyIdToken(idToken: string) {
    return await admin.auth().verifyIdToken(idToken);
}
