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

    // Leer variables de entorno públicas
    const coinsPerToken = parseFloat(process.env.NEXT_PUBLIC_COINS_PER_TOKEN!);
    const coinsPerMb = parseFloat(process.env.NEXT_PUBLIC_COINS_PER_MB!);

    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState<"date" | "name">("date");
    const [transcripts, setTranscripts] = useState<Transcription[]>([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState<Transcription | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [popupCopied, setPopupCopied] = useState(false);

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
            const allowedExt = /\.(mp3|mp4|mpeg|mpga|m4a|wav|webm)$/i;
            if (f.size > maxSizeMB * 1024 * 1024) {
                setError(`Archivo demasiado grande. Máximo ${maxSizeMB} MB.`);
                setFile(null);
                return;
            }
            if (!allowedExt.test(f.name)) {
                setError("Formato no soportado. Usa mp3, mp4, mpeg, mpga, m4a, wav o webm.");
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
            if (selected?._id === id) setSelected(null);
        } catch (err: any) {
            console.error("Eliminar transcripción:", err);
            setError(err.message || "No se pudo eliminar la transcripción.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Filtrado y orden (no muta el array original)
    const filtered = transcripts.filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) =>
        sortOption === "date"
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : a.title.localeCompare(b.title)
    );

    return (
        <div className={`container ${styles.pageContainer}`}>
            <CoinPurchaseModal
                visible={isModalOpen}
                onClose={() => setModalOpen(false)}
                onPurchase={async () => {
                    await refreshCoins();
                    setModalOpen(false);
                }}
            />

            <div className={`card ${styles.transcriptionCard}`}>
                {/* Toolbar fijo */}
                <Toolbar
                    balance={coinsBalance}
                    onBack={() => router.push("/menu")}
                    onBuy={() => setModalOpen(true)}
                />

                {/* Contenido desplazable */}
                <div className={styles.content}>
                    {/* Título principal */}
                    <h1 className={styles.mainTitle}>Mis Transcripciones de Audio</h1>

                    {/* Mensajes */}
                    {isProcessing && (
                        <div className={styles.processingMessage}>
                            ⏳ Procesando... por favor espera.
                        </div>
                    )}
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    {/* Sección de carga */}
                    <h2 className={styles.sectionTitle}>Carga y Transcripción</h2>
                    <section className={styles.tools}>
                        <div className={styles.fileInput}>
                            <input
                                type="file"
                                id="audioUpload"
                                accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
                                onChange={handleFileChange}
                                disabled={isProcessing || coinsBalance <= 0}
                            />
                            <label
                                htmlFor="audioUpload"
                                className={`btn ${styles.actionButton}`}
                                onClick={() => coinsBalance <= 0 && setModalOpen(true)}
                            >
                                📂 Subir archivo
                            </label>
                            {file && (
                                <span className={styles.fileInfo}>{file.name}</span>
                            )}
                            <small className={styles.fileInfo}>
                                Formatos permitidos: mp3, mp4, mpeg, mpga, m4a, wav, webm — hasta 25 MB.
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
                            <p className={styles.costInfo}>
                                El costo en ThemiCoins actual es de {coinsPerMb} monedas por MB y {coinsPerToken} monedas por token.
                            </p>
                        </div>
                    </section>

                    <hr className="divider" />

                    {/* Recursos externos */}
                    <h2 className={styles.sectionTitle}>Recursos Externos</h2>
                    <p>
                        Si tenés un archivo de video o audio en un formato no compatible, convertilo antes. Si tu archivo supera los 25 MB o querés reducir su tamaño para ahorrar ThemiCoins, podés comprimirlo.
                    </p>
                    <section className={styles.tools}>
                        <a
                            href="https://convertio.co/es/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`btn ${styles.actionButton}`}
                        >
                            Convertir formato
                        </a>
                        <a
                            href="https://www.freeconvert.com/es/mp3-compressor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`btn ${styles.actionButton}`}
                        >
                            Comprimir audio
                        </a>
                    </section>

                    <hr className="divider" />

                    {/* Sección de búsqueda */}
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
                        <button
                            className={`btn ${styles.actionButton}`}
                            onClick={() => { }}
                            disabled={isProcessing}
                        >
                            Buscar
                        </button>
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

                    {/* Sección de lista adaptada a cards */}
                    <h2 className={styles.sectionTitle}>Transcripciones</h2>
                    <section className={styles.cardGrid}>
                        {sorted.length === 0 ? (
                            <p className={styles.textCenter}>No hay transcripciones.</p>
                        ) : (
                            sorted.map((t) => (
                                <div key={t._id} className={`card ${styles.cardItem}`}>
                                    <div className={styles.listItemHeaderGrid}>
                                        <div className={styles.listItemContent}>
                                            <strong>{t.title}</strong>
                                            <span className={styles.listItemDate}>
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
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
                                            className={`btn ${styles.actionButton} ${styles.copyButton}`}
                                            onClick={() => handleCopy(t._id, t.text)}
                                            disabled={isProcessing}
                                        >
                                            Copiar
                                        </button>
                                        {copiedId === t._id && (
                                            <span className={styles.copyConfirm}>
                                                Copiado!
                                            </span>
                                        )}
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

                {/* Popup de detalle */}
                {selected && (
                    <Popup
                        isOpen={true}
                        onClose={() => {
                            setSelected(null);
                            setPopupCopied(false);
                        }}
                        width="90vw"
                        height="auto"
                        zIndex={1500}
                    >
                        <TranscriptionDetail transcription={selected} />
                        <div className={styles.popupActions}>
                            <button
                                className="btn"
                                onClick={() => {
                                    handleCopy(selected._id, selected.text);
                                    setPopupCopied(true);
                                }}
                            >
                                Copiar texto
                            </button>
                            <button
                                className="btn ml-2"
                                onClick={() => handleDelete(selected._id)}
                            >
                                Eliminar
                            </button>
                            {popupCopied && <p>Texto copiado al portapapeles</p>}
                        </div>
                    </Popup>
                )}
            </div>
        </div>
    );
}

