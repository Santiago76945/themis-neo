// src/app/menu/audio-transcription/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { uploadAudioFile } from "@/lib/uploadToFirebase";
import {
    getTranscriptions,
    postTranscription,
    deleteTranscription,
} from "@/lib/apiClient";
import CoinPurchaseModal from "@/components/CoinPurchaseModal";
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

export default function AudioTranscriptionPage() {
    const router = useRouter();
    const { user, coinsBalance, refreshCoins } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState<"date" | "name">("date");
    const [transcripts, setTranscripts] = useState<Transcription[]>([]);
    const [isModalOpen, setModalOpen] = useState(false);

    const COINS_PER_TOKEN = parseFloat(
        process.env.NEXT_PUBLIC_COINS_PER_TOKEN || "0"
    );

    // Carga inicial de transcripciones
    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const data = await getTranscriptions();
                if (Array.isArray(data)) setTranscripts(data);
                else console.error("API /transcriptions devolvió:", data);
            } catch (e) {
                console.error("Error cargando transcripciones:", e);
            }
        })();
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        setFile(e.target.files?.[0] ?? null);
    };

    const handleTranscribe = async () => {
        setError("");
        if (!file) {
            setError("Por favor, sube un archivo primero.");
            return;
        }
        if (!title.trim()) {
            setError("Por favor, ingresa un título para la transcripción.");
            return;
        }
        if (!user) {
            setError("Necesitas iniciar sesión.");
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Subir el audio a Firebase Storage
            const fileUrl = await uploadAudioFile(file, user.uid);

            // 2. Crear transcripción vía apiClient
            const created: Transcription = await postTranscription({ title, fileUrl });
            setTranscripts((prev) => [created, ...prev]);

            // Limpiar inputs
            setFile(null);
            setTitle("");

            // Refrescar balance tras la transcripción
            await refreshCoins();
        } catch (err: any) {
            console.error("Transcribir:", err);
            setError(err.message || "Ocurrió un error al transcribir.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        setError("");
        setIsProcessing(true);
        try {
            await deleteTranscription(id);
            setTranscripts((prev) => prev.filter((t) => t._id !== id));
        } catch (err: any) {
            console.error("Eliminar transcripción:", err);
            setError(err.message || "No se pudo eliminar la transcripción.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Filtrar + ordenar
    const filtered = transcripts.filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sorted = filtered.sort((a, b) =>
        sortOption === "date"
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : a.title.localeCompare(b.title)
    );

    return (
        <div className={`container ${styles.pageContainer}`}>
            {/* Modal de compra de ThemiCoins */}
            <CoinPurchaseModal
                visible={isModalOpen}
                onClose={() => setModalOpen(false)}
                onPurchase={async (amount: number) => {
                    // Aquí llamarías a tu API de /api/coins para añadir coins
                    await refreshCoins(); // refresca balance tras compra
                    setModalOpen(false);
                }}
            />

            <div className={`card ${styles.transcriptionCard}`}>
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>Transcripción de audio a texto</h1>
                    <div className={styles.headerControls}>
                        <div className={styles.coinCounter}>
                            Saldo: {coinsBalance.toFixed(2)} ThemiCoin
                        </div>
                        <button
                            className={`btn ${styles.actionButton}`}
                            onClick={() => setModalOpen(true)}
                            disabled={isProcessing}
                        >
                            + Comprar
                        </button>
                        <button
                            className={`btn ${styles.actionButton}`}
                            onClick={() => router.push("/menu")}
                            disabled={isProcessing}
                        >
                            Volver al menú
                        </button>
                    </div>
                </header>

                <div className={styles.content}>
                    {isProcessing && (
                        <div className={styles.processingMessage}>
                            ⏳ Procesando... por favor espera.
                        </div>
                    )}
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <section className={styles.tools}>
                        <div className={styles.fileInput}>
                            <input
                                type="file"
                                id="audioUpload"
                                accept="audio/*"
                                onChange={handleFileChange}
                                disabled={isProcessing}
                            />
                            <label
                                htmlFor="audioUpload"
                                className={`btn ${styles.actionButton}`}
                            >
                                📂 Subir archivo
                            </label>
                            {file && <span className={styles.fileInfo}>{file.name}</span>}
                            <small className={styles.fileInfo}>
                                Formatos: mp3, wav, m4a. Máx 25 MB.
                            </small>
                        </div>
                        <input
                            type="text"
                            placeholder="Título de la transcripción"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setError("");
                            }}
                            className="input"
                            disabled={isProcessing}
                        />
                        <button
                            className={`btn ${styles.actionButton}`}
                            onClick={handleTranscribe}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Procesando..." : "Iniciar transcripción"}
                        </button>
                    </section>

                    <section className={styles.tools}>
                        <input
                            type="text"
                            placeholder="Buscar transcripción"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input"
                            disabled={isProcessing}
                        />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as any)}
                            className="input"
                            disabled={isProcessing}
                        >
                            <option value="date">Fecha (reciente → antigua)</option>
                            <option value="name">Nombre (A → Z)</option>
                        </select>
                    </section>

                    <section className={styles.list}>
                        {sorted.length === 0 ? (
                            <p className={styles.textCenter}>No hay transcripciones.</p>
                        ) : (
                            sorted.map((t) => (
                                <div key={t._id} className={styles.listItem}>
                                    <div className={styles.listItemHeader}>
                                        <strong>{t.title}</strong>
                                        <span className={styles.listItemDate}>
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={styles.listItemActions}>
                                        <button
                                            className={`btn ${styles.actionButton}`}
                                            onClick={() =>
                                                router.push(
                                                    `/menu/audio-transcription/${t._id}`
                                                )
                                            }
                                            disabled={isProcessing}
                                        >
                                            Ver
                                        </button>
                                        <button
                                            className={`btn ${styles.actionButton}`}
                                            onClick={() =>
                                                navigator.clipboard.writeText(t.text)
                                            }
                                            disabled={isProcessing}
                                        >
                                            Copiar
                                        </button>
                                        <button
                                            className={`btn ${styles.actionButton}`}
                                            onClick={() => handleDelete(t._id)}
                                            disabled={isProcessing}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
