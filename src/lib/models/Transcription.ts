// src/lib/models/Transcription.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITranscription extends Document {
    userUid: string;
    title: string;
    fileUrl: string;
    text: string;
    tokens: number;
    fileSize?: number;     // tamaño en bytes del archivo procesado
    sizeCost?: number;     // coste adicional por tamaño
    coinsCost: number;
    createdAt: Date;
}

const TranscriptionSchema: Schema<ITranscription> = new Schema(
    {
        userUid: { type: String, required: true, index: true },
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        text: { type: String, default: '' },
        tokens: { type: Number, default: 0 },
        fileSize: { type: Number, default: 0 },
        sizeCost: { type: Number, default: 0 },
        coinsCost: { type: Number, required: true },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

const Transcription: Model<ITranscription> =
    (mongoose.models.Transcription as Model<ITranscription>) ||
    mongoose.model<ITranscription>('Transcription', TranscriptionSchema);

export default Transcription;
