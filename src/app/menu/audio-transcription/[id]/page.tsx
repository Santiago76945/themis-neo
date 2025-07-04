// src/app/menu/audio-transcription/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { deleteTranscription } from "@/lib/apiClient";
import Popup from "@/components/Popup";
import styles from "@/components/styles/AudioTranscription.module.css";

interface Transcription {
    _id: string;
    title: string;
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
    const [copied, setCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!user || !id) return;
        (async () => {
            try {
                const token = await user.getIdToken();
                const res = await fetch(`/api/transcriptions/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Error al cargar datos");
                const data: Transcription = await res.json();
                setTranscription(data);
            } catch (e: any) {
                setError(e.message || "Error desconocido");
            } finally {
                setLoading(false);
            }
        })();
    }, [user, id]);

    const handleCopy = () => {
        if (transcription) {
            navigator.clipboard.writeText(transcription.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDelete = async () => {
        if (!id || !user) return;
        setIsDeleting(true);
        try {
            await deleteTranscription(id);
            router.back();
        } catch (e: any) {
            console.error("Error eliminando transcripción:", e);
            setError(e.message || "No se pudo eliminar");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Popup
            isOpen={true}
            onClose={() => router.back()}
            width="800px"
            height="auto"
            zIndex={1500}
        >
            {loading && <p className={styles.textCenter}>Cargando...</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}
            {transcription && (
                <div className={styles.pageContainer}>
                    <h1 className={styles.pageTitle}>{transcription.title}</h1>
                    <p className={styles.listItemDate}>
                        Creado el {new Date(transcription.createdAt).toLocaleString()}
                    </p>

                    <div className="prose">
                        <h2>Transcripción</h2>
                        <p>{transcription.text}</p>
                    </div>

                    <div className="mt-4">
                        <strong>Tokens usados:</strong> {transcription.tokens}
                        <br />
                        <strong>Coste:</strong> {transcription.coinsCost} ThemiCoins
                    </div>

                    <div className="mt-6 flex gap-4 justify-center">
                        <button
                            className={`btn ${styles.actionButton}`}
                            onClick={handleCopy}
                            disabled={copied}
                        >
                            {copied ? "¡Copiado!" : "Copiar texto"}
                        </button>
                        <button
                            className={`btn ${styles.actionButton}`}
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </button>
                    </div>
                </div>
            )}
        </Popup>
    );
}

