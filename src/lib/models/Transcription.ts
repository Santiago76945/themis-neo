// src/lib/models/Transcription.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITranscription extends Document {
    userUid: string;
    title: string;
    fileUrl: string;
    text: string;
    tokens: number;
    coinsCost: number;
    createdAt: Date;
}

const TranscriptionSchema: Schema<ITranscription> = new Schema(
    {
        userUid: { type: String, required: true, index: true },
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        text: { type: String, default: '' },       // ya no es required
        tokens: { type: Number, default: 0 },      // ya no es required
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
