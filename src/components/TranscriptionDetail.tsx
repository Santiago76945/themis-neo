// src/components/TranscriptionDetail.tsx

"use client";

import React from "react";
import styles from "@/components/styles/AudioTranscription.module.css";

export interface Transcription {
    _id: string;
    title: string;
    fileUrl: string;
    text: string;
    tokens: number;
    coinsCost: number;
    createdAt: string;
}

interface TranscriptionDetailProps {
    transcription: Transcription;
}

export default function TranscriptionDetail({
    transcription,
}: TranscriptionDetailProps) {
    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.pageTitle}>{transcription.title}</h1>
            <p className={styles.listItemDate}>
                Creado el {new Date(transcription.createdAt).toLocaleString()}
            </p>

            <audio
                controls
                src={transcription.fileUrl}
                className="w-full my-4"
            />

            <div className="prose">
                <h2>Transcripción</h2>
                <p>{transcription.text}</p>
            </div>

            <div className="mt-4">
                <strong>Tokens usados:</strong> {transcription.tokens}
                <br />
                <strong>Coste:</strong> {transcription.coinsCost} ThemiCoins
            </div>
        </div>
    );
}
