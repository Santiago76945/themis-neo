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
import Toolbar from "@/components/Toolbar";
import Popup from "@/components/Popup";
import CoinPurchaseModal from "@/components/CoinPurchaseModal";
import TranscriptionDetail from "@/components/TranscriptionDetail";
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
    const [selected, setSelected] = useState<Transcription | null>(null);

    useEffect(() => {
        if (user) refreshCoins();
    }, [user, refreshCoins]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const data = await getTranscriptions();
                if (Array.isArray(data)) setTranscripts(data);
            } catch (e) {
                console.error("Error cargando transcripciones:", e);
            }
        })();
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        if (coinsBalance <= 0) {
            setError("Saldo insuficiente. Compra ThemiCoins para subir archivos.");
            setFile(null);
            setModalOpen(true);
            return;
        }
        const f = e.target.files?.[0] ?? null;
        if (f) {
            const maxSizeMB = 25;
            const allowedExt = /\.(mp3|wav|m4a)$/i;
            if (f.size > maxSizeMB * 1024 * 1024) {
                setError(`Archivo demasiado grande. Máximo ${maxSizeMB} MB.`);
                setFile(null);
                return;
            }
            if (!allowedExt.test(f.name)) {
                setError("Formato no soportado. Usa mp3, wav o m4a.");
                setFile(null);
                return;
            }
        }
        setFile(f);
    };

    const handleTranscribe = async () => {
        setError("");
        if (coinsBalance <= 0) {
            setError("Saldo insuficiente. Compra ThemiCoins para transcribir.");
            setModalOpen(true);
            return;
        }
        if (!file) {
            setError("Debes seleccionar un archivo de audio válido.");
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
            const fileUrl = await uploadAudioFile(file, user.uid);
            const created = await postTranscription({ title, fileUrl });
            setTranscripts((prev) => [created, ...prev]);
            setFile(null);
            setTitle("");
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
            <CoinPurchaseModal
                visible={isModalOpen}
                onClose={() => setModalOpen(false)}
                onPurchase={async (amount: number) => {
                    await refreshCoins();
                    setModalOpen(false);
                }}
            />

            <div className={`card ${styles.transcriptionCard}`}>
                <Toolbar
                    balance={coinsBalance}
                    onBack={() => router.push("/menu")}
                    onBuy={() => setModalOpen(true)}
                />

                <h1 className={styles.pageTitle}>
                    Transcripción de audio a texto
                </h1>

                <h2 className={styles.sectionTitle}>Carga y Transcripción</h2>

                <div className={styles.content}>
                    {isProcessing && (
                        <div className={styles.processingMessage}>
                            ⏳ Procesando... por favor espera.
                        </div>
                    )}
                    {error && (
                        <div className={styles.errorMessage}>{error}</div>
                    )}

                    <section className={styles.tools}>
                        <div className={styles.fileInput}>
                            <input
                                type="file"
                                id="audioUpload"
                                accept=".mp3,.wav,.m4a"
                                onChange={handleFileChange}
                                disabled={isProcessing || coinsBalance <= 0}
                            />
                            <label
                                htmlFor="audioUpload"
                                className={`btn ${styles.actionButton}`}
                                onClick={() =>
                                    coinsBalance <= 0 && setModalOpen(true)
                                }
                            >
                                📂 Subir archivo
                            </label>
                            {file && (
                                <span className={styles.fileInfo}>{file.name}</span>
                            )}
                            <small className={styles.fileInfo}>
                                Formatos permitidos: mp3, wav, m4a — hasta 25 MB.
                            </small>
                        </div>
                        <div className={styles.titleAndAction}>
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
                                disabled={isProcessing || coinsBalance <= 0}
                            >
                                {isProcessing ? "Procesando..." : "Iniciar transcripción"}
                            </button>
                        </div>
                    </section>

                    <hr className="divider" />
                    <h2 className={styles.sectionTitle}>Buscar y Filtrar</h2>

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
                            onChange={(e) =>
                                setSortOption(e.target.value as "date" | "name")
                            }
                            className="input"
                            disabled={isProcessing}
                        >
                            <option value="date">Fecha (reciente → antigua)</option>
                            <option value="name">Nombre (A → Z)</option>
                        </select>
                    </section>

                    <hr className="divider" />
                    <h2 className={styles.sectionTitle}>Transcripciones</h2>

                    <section className={styles.list}>
                        {sorted.length === 0 ? (
                            <p className={styles.textCenter}>No hay transcripciones.</p>
                        ) : (
                            sorted.map((t) => (
                                <div key={t._id} className={styles.listItem}>
                                    <div className={styles.listItemHeaderGrid}>
                                        <div className={styles.listItemContent}>
                                            <strong>{t.title}</strong>
                                            <span className={styles.listItemDate}>
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className={styles.listItemActions}>
                                            <button
                                                className={`btn ${styles.actionButton}`}
                                                onClick={() => setSelected(t)}
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
                                </div>
                            ))
                        )}
                    </section>
                </div>
            </div>

            <Popup
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                width="90vw"
                height="auto"
                zIndex={1500}
            >
                {selected && <TranscriptionDetail transcription={selected} />}
            </Popup>
        </div>
    );
}
