// src/lib/firebaseAdmin.ts

import * as admin from "firebase-admin";

// Inicializa una única instancia del Admin SDK de Firebase
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!serviceAccount) {
        throw new Error(
            "FIREBASE_SERVICE_ACCOUNT must be defined in environment variables"
        );
    }
    if (!storageBucket) {
        throw new Error(
            "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET must be defined in environment variables"
        );
    }

    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
        storageBucket, // configura el bucket por defecto
    });
}

// `adminStorage` es YA un objeto `Bucket`
export const adminStorage = admin.storage().bucket();

/**
 * Verifica un ID token de Firebase, devolviendo el payload decodificado.
 * Lanza error si el token no es válido.
 */
export async function verifyIdToken(idToken: string) {
    return await admin.auth().verifyIdToken(idToken);
}
