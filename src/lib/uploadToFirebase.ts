// src/lib/uploadToFirebase.ts

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Sube un archivo de audio al bucket en la ruta `audios/{userId}/...`
 * valida extensión y tamaño antes de la subida,
 * y devuelve la URL pública de descarga.
 */
export async function uploadAudioFile(
    file: File,
    userId: string
): Promise<string> {
    // Validar tamaño máximo según Whisper (25 MB)
    const maxSizeMB = 25;
    if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`No se pudo subir: el archivo supera ${maxSizeMB} MB.`);
    }
    // Validar extensiones admitidas por Whisper
    const allowedExt = /\.(mp3|wav|m4a)$/i;
    if (!allowedExt.test(file.name)) {
        throw new Error("No se pudo subir: formato no soportado. Usa mp3, wav o m4a.");
    }

    const fileName = `${Date.now()}-${file.name}`;
    const fileRef = ref(storage, `audios/${userId}/${fileName}`);

    try {
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    } catch (err: any) {
        console.error("uploadAudioFile error:", err);
        // Capturar errores de permisos de Storage
        if (err.code === 'storage/unauthorized' || err.code === 'storage/permission-denied') {
            throw new Error("No tienes permisos para subir este archivo.");
        }
        throw new Error("Error subiendo el archivo. Intenta de nuevo más tarde.");
    }
}
