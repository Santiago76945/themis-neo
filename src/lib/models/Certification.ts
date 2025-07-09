// src/lib/models/Certification.ts

import mongoose from 'mongoose';

/**
 * Datos de cada firmante en la certificación.
 */
export interface PartyData {
    name: string;
    dni: string;
    idImageUrl: string;
    audioUrl: string;
    timestamp: string;
    ip: string;
}

/**
 * Estructura de la certificación.
 */
export interface Certification {
    code: string;
    pdfUrl: string;
    hash: string;
    parties: PartyData[];
    createdAt: Date;
}

/**
 * Documento de Mongoose para Certification.
 */
interface CertificationDocument extends mongoose.Document, Certification { }

/**
 * Esquema de MongoDB para Certification.
 */
const CertificationSchema = new mongoose.Schema<CertificationDocument>(
    {
        code: { type: String, required: true, unique: true, index: true },
        pdfUrl: { type: String, required: true },
        hash: { type: String, required: true },
        parties: [
            {
                name: { type: String, required: true },
                dni: { type: String, required: true },
                idImageUrl: { type: String, required: true },
                audioUrl: { type: String, required: true },
                timestamp: { type: String, required: true },
                ip: { type: String, required: true },
            },
        ],
        createdAt: { type: Date, required: true, default: () => new Date() },
    },
    { collection: 'certifications' }
);

/**
 * Modelo de Certification.
 * Se reutiliza si ya existe en mongoose.models para evitar recompilaciones en desarrollo.
 */
export const CertificationModel =
    (mongoose.models.Certification as mongoose.Model<CertificationDocument>) ||
    mongoose.model<CertificationDocument>('Certification', CertificationSchema);
