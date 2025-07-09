// src/lib/uploadToFirebase.ts

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

interface UploadOptions {
    userId: string;
    folder: string;
    maxSizeMB: number;
    allowedExt: RegExp;
}

/**
 * Sube un archivo al bucket en la ruta `{folder}/{userId}/...`.
 * Valida extensión y tamaño antes de la subida,
 * y devuelve la URL pública de descarga.
 */
async function uploadFile(
    file: File,
    { userId, folder, maxSizeMB, allowedExt }: UploadOptions
): Promise<string> {
    // Validación de tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`No se pudo subir: el archivo supera ${maxSizeMB} MB.`);
    }
    // Validación de extensión
    if (!allowedExt.test(file.name)) {
        throw new Error(`Formato no soportado. Usa: ${allowedExt}`);
    }

    const fileName = `${Date.now()}-${file.name}`;
    const fileRef = ref(storage, `${folder}/${userId}/${fileName}`);

    try {
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    } catch (err: any) {
        console.error("uploadFile error:", err);
        if (err.code === 'storage/unauthorized' || err.code === 'storage/permission-denied') {
            throw new Error("No tienes permisos para subir este archivo.");
        }
        throw new Error("Error subiendo el archivo. Intenta de nuevo más tarde.");
    }
}

/**
 * Sube un archivo de audio al bucket en la ruta `audios/{userId}/...`.
 */
export function uploadAudioFile(file: File, userId: string): Promise<string> {
    return uploadFile(file, {
        userId,
        folder: "audios",
        maxSizeMB: 25,
        allowedExt: /\.(mp3|wav|m4a|webm)$/i,
    });
}

/**
 * Sube una imagen al bucket en la ruta `images/{userId}/...`.
 */
export function uploadImageFile(file: File, userId: string): Promise<string> {
    return uploadFile(file, {
        userId,
        folder: "images",
        maxSizeMB: 1,
        allowedExt: /\.(png|jpe?g)$/i,
    });
}

/**
 * Sube un PDF al bucket en la ruta `pdfs/{userId}/...`.
 */
export function uploadPdfFile(file: File, userId: string): Promise<string> {
    return uploadFile(file, {
        userId,
        folder: "pdfs",
        maxSizeMB: 10,
        allowedExt: /\.pdf$/i,
    });
}
