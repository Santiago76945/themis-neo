// src/lib/firebaseAdmin.ts

import * as admin from 'firebase-admin';

// Inicializa una única instancia del Admin SDK de Firebase
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT must be defined in environment variables');
    }
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
}

/**
 * Verifica un ID token de Firebase, devolviendo el payload decodificado.
 * Lanza error si el token no es válido.
 */
export async function verifyIdToken(idToken: string) {
    return await admin.auth().verifyIdToken(idToken);
}
