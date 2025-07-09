// src/lib/repositories/certificationRepository.ts

import { connectToDatabase } from '@/lib/db';
import { CertificationModel, Certification } from '@/lib/models/Certification';

/**
 * Busca una certificación por su código.
 * Retorna null si no existe.
 */
export async function getCertificationByCode(
    code: string
): Promise<Certification | null> {
    await connectToDatabase();
    const doc = await CertificationModel.findOne({ code }).lean();
    if (!doc) return null;
    // `doc` ya tiene la forma de Certification gracias a lean()
    return {
        code: doc.code,
        pdfUrl: doc.pdfUrl,
        hash: doc.hash,
        parties: doc.parties,
        createdAt: doc.createdAt,
    };
}

/**
 * Guarda una nueva certificación en la base de datos.
 * Utiliza el código ya generado y no introduce timestamps volátiles.
 */
export async function saveCertification(
    cert: Omit<Certification, 'createdAt'>
): Promise<Certification> {
    await connectToDatabase();
    const newDoc = new CertificationModel({
        ...cert,
        createdAt: new Date(),
    });
    const saved = await newDoc.save();
    return {
        code: saved.code,
        pdfUrl: saved.pdfUrl,
        hash: saved.hash,
        parties: saved.parties,
        createdAt: saved.createdAt,
    };
}
