// src/lib/uploadToFirebase.ts

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Sube un archivo de audio al bucket en la ruta `audios/{userId}/...`
 * y devuelve la URL pública de descarga.
 */
export async function uploadAudioFile(
    file: File,
    userId: string
): Promise<string> {
    const fileRef = ref(
        storage,
        `audios/${userId}/${Date.now()}-${file.name}`
    );
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
}
