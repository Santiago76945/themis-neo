// src/lib/firebaseAdmin.ts

import * as admin from "firebase-admin";

// Variables de entorno
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET; // debe ser "themis-971b4.appspot.com"

if (!serviceAccountJson) {
    throw new Error(
        "FIREBASE_SERVICE_ACCOUNT debe estar definido en las variables de entorno"
    );
}
if (!storageBucketName) {
    throw new Error(
        "FIREBASE_STORAGE_BUCKET debe estar definido en las variables de entorno"
    );
}

// Inicializa una única instancia del Admin SDK de Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
        storageBucket: storageBucketName,
    });
}

// `adminStorage` es un objeto `Bucket` para operaciones con archivos
export const adminStorage = admin.storage().bucket(storageBucketName);

/**
 * Verifica un ID token de Firebase, devolviendo el payload decodificado.
 * Lanza error si el token no es válido.
 */
export async function verifyIdToken(idToken: string) {
    return await admin.auth().verifyIdToken(idToken);
}
