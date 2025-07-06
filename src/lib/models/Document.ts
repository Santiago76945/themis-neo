// src/lib/models/Document.ts

import mongoose from "mongoose";

// Atributos necesarios para crear un Documento
export interface DocumentAttrs {
    title: string;
    userUid: string;
    model: string;
    info: string;
    content: string;
    tokens: number;
    coinsCost: number;
}

// Definición del esquema de Mongoose
const DocumentSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        userUid: { type: String, required: true, index: true },
        model: { type: String, required: true },
        info: { type: String, required: true },
        content: { type: String, default: "" },
        tokens: { type: Number, default: 0 },
        coinsCost: { type: Number, required: true },
    },
    { timestamps: true }
);

// Tipo inferido a partir del esquema
export type DocumentDoc = mongoose.InferSchemaType<typeof DocumentSchema>;

// Modelo de Mongoose para Document
const GeneratedDocument =
    (mongoose.models.GeneratedDocument as mongoose.Model<DocumentDoc>) ||
    mongoose.model<DocumentDoc>("GeneratedDocument", DocumentSchema);

export default GeneratedDocument;
