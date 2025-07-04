// src/app/menu/audio-transcription/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Popup from "@/components/Popup";
import styles from "@/components/styles/AudioTranscription.module.css";

interface Transcription {
    _id: string;
    title: string;
    fileUrl: string;
    text: string;
    tokens: number;
    coinsCost: number;
    createdAt: string;
}

export default function TranscriptionDetailPage() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const router = useRouter();
    const { user } = useAuth();

    const [transcription, setTranscription] = useState<Transcription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user || !id) return;
        (async () => {
            try {
                const token = await user.getIdToken();
                const res = await fetch("/api/transcriptions", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Error al cargar datos");
                const list: Transcription[] = await res.json();
                const found = list.find((t) => t._id === id);
                if (!found) throw new Error("Transcripción no encontrada");
                setTranscription(found);
            } catch (e: any) {
                setError(e.message || "Error desconocido");
            } finally {
                setLoading(false);
            }
        })();
    }, [user, id]);

    return (
        <Popup
            isOpen={true}
            onClose={() => router.back()}
            width="800px"
            height="auto"
            zIndex={1500}
        >
            {loading && (
                <p className={styles.textCenter}>Cargando...</p>
            )}
            {error && (
                <p className={styles.errorMessage}>{error}</p>
            )}
            {transcription && (
                <div className={styles.pageContainer}>
                    <h1 className={styles.pageTitle}>{transcription.title}</h1>
                    <p className={styles.listItemDate}>
                        Creado el{" "}
                        {new Date(transcription.createdAt).toLocaleString()}
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
                        <strong>Tokens usados:</strong>{" "}
                        {transcription.tokens}
                        <br />
                        <strong>Coste:</strong>{" "}
                        {transcription.coinsCost} ThemiCoins
                    </div>
                </div>
            )}
        </Popup>
    );
}
