// src/app/menu/documents-generator/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Toolbar from "@/components/Toolbar";
import Popup from "@/components/Popup";
import CoinPurchaseModal from "@/components/CoinPurchaseModal";
import DocxDownloadButton from "@/components/DocxDownloadButton";
import { TEMPLATE_BASE64 } from "@/assets/templateBase64";
import styles from "@/components/styles/DocumentsGenerator.module.css";
import {
    getDocuments,
    getDocumentModels,
    postDocument,
    deleteDocument,
    DocumentData,
    DocumentModel,
} from "@/lib/apiClient";

export default function DocumentsGeneratorPage() {
    const router = useRouter();
    const { user, coinsBalance, refreshCoins } = useAuth();

    const coinsPerToken = parseFloat(
        process.env.NEXT_PUBLIC_COINS_PER_TOKEN || "0"
    );

    const [models, setModels] = useState<DocumentModel[]>([]);
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [view, setView] = useState<"create" | "view-models">("create");
    const [searchModel, setSearchModel] = useState<string>("");

    const [selectedModel, setSelectedModel] = useState<DocumentModel | null>(
        null
    );
    const [docTitle, setDocTitle] = useState<string>("");
    const [customInfo, setCustomInfo] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState<boolean>(
        false
    );

    // Estado para el feedback de copia
    const [copied, setCopied] = useState(false);

    const [showModelPopup, setShowModelPopup] = useState<boolean>(false);
    const [popupModel, setPopupModel] = useState<DocumentModel | null>(null);
    const [showGeneratedPopup, setShowGeneratedPopup] =
        useState<boolean>(false);
    const [popupDoc, setPopupDoc] = useState<DocumentData | null>(null);

    // Carga inicial de modelos y documentos
    useEffect(() => {
        if (!user) return;
        refreshCoins();

        getDocumentModels()
            .then((ms) => setModels(ms))
            .catch((e) => console.error("Error cargando modelos:", e));

        getDocuments()
            .then((docs) => setDocuments(docs))
            .catch((e) => console.error("Error cargando escritos:", e));
    }, [user, refreshCoins]);

    // Filtrado y placeholder
    const filteredModels = models
        .filter((m) => m.title.toLowerCase().includes(searchModel.toLowerCase()))
        .sort((a, b) => a.title.localeCompare(b.title));

    const placeholderText =
        selectedModel?.recommendation || "Información a personalizar...";

    // Generar escrito
    const handleGenerate = async () => {
        setError("");
        if (!selectedModel) {
            setError("Por favor selecciona un modelo.");
            return;
        }
        if (!docTitle.trim()) {
            setError("El título no puede estar vacío.");
            return;
        }
        if (coinsBalance <= 0) {
            setError("Saldo insuficiente. Compra ThemiCoins.");
            setPurchaseModalOpen(true);
            return;
        }

        setIsProcessing(true);
        try {
            const created = await postDocument({
                title: docTitle.trim(),
                modelTitle: selectedModel.title,
                model: selectedModel.content,
                info: customInfo.trim(),
            });
            setDocuments((prev) => [created, ...prev]);
            setShowModelPopup(false);
            setPopupDoc(created);
            setShowGeneratedPopup(true);
            setDocTitle("");
            setCustomInfo("");
            setSelectedModel(null);
        } catch (e: any) {
            console.error("Error generando escrito:", e);
            setError(e.message || "Ocurrió un error.");
        } finally {
            setIsProcessing(false);
            await refreshCoins();
        }
    };

    // Eliminar escrito de la lista
    const handleDelete = async (id: string) => {
        try {
            await deleteDocument(id);
            setDocuments((prev) => prev.filter((d) => d._id !== id));
        } catch (e) {
            console.error("Error eliminando escrito:", e);
        }
    };

    // Abrir popups
    const openModelPopup = (model: DocumentModel) => {
        setPopupModel(model);
        setShowModelPopup(true);
    };
    const openDocPopup = (doc: DocumentData) => {
        setShowModelPopup(false);
        setPopupDoc(doc);
        setShowGeneratedPopup(true);
    };

    // Handler de copiado (se usa dentro del popup de detalle)
    const handleCopy = async () => {
        if (!popupDoc) return;
        const textToCopy = `${popupDoc.modelTitle}\n\n${popupDoc.content.split("\n").join(" ")}`;
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`container ${styles.pageContainer}`}>
            {showModelPopup && popupModel && (
                <Popup
                    isOpen
                    onClose={() => setShowModelPopup(false)}
                    width="600px"
                    zIndex={2000}
                >
                    <h2 className={styles.mainTitle}>{popupModel.title}</h2>
                    <div className={styles.modelContent}>
                        {popupModel.content.split("\n").map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                </Popup>
            )}

            {showGeneratedPopup && popupDoc && (
                <Popup
                    isOpen
                    onClose={() => setShowGeneratedPopup(false)}
                    width="800px"
                    zIndex={2000}
                >
                    {/* Título que puso el usuario */}
                    <h2 className={styles.mainTitle}>{popupDoc.title}</h2>

                    {/* Encabezado legal: título del modelo */}
                    <h3 className={styles.sectionTitle}>{popupDoc.modelTitle}</h3>

                    {/* Cuerpo del documento en un solo párrafo */}
                    <div className="prose my-4">
                        <p>{popupDoc.content.split("\n").join(" ")}</p>
                    </div>

                    {/* Botones de acción: copiar y descargar */}
                    <div className="flex gap-2 my-4">
                        {/* Botón de copiar con feedback */}
                        <button
                            className={`btn ${styles.modalButton}`}
                            onClick={handleCopy}
                            disabled={copied}
                        >
                            {copied ? "¡Copiado!" : "Copiar texto"}
                        </button>

                        {/* Botón de descargar .docx */}
                        <DocxDownloadButton
                            documentTitle={popupDoc.modelTitle}
                            body={popupDoc.content}
                            fileName={popupDoc.title}
                        />
                    </div>

                    {/* Fecha y coste */}
                    <p className={styles.listItemDate}>
                        Creado el {new Date(popupDoc.createdAt).toLocaleString()}
                    </p>
                    <p className={styles.listItemDate}>
                        ThemiCoins consumidos: {popupDoc.coinsCost}
                    </p>
                </Popup>
            )}

            <CoinPurchaseModal
                visible={isPurchaseModalOpen}
                onClose={() => setPurchaseModalOpen(false)}
                onPurchase={async () => {
                    await refreshCoins();
                    setPurchaseModalOpen(false);
                }}
            />

            <div className={`card ${styles.cardWrapper}`}>
                <Toolbar
                    balance={coinsBalance}
                    onBack={() => router.back()}
                    onBuy={() => setPurchaseModalOpen(true)}
                />

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabButton} ${view === "create" ? styles.active : ""}`}
                        onClick={() => setView("create")}
                    >
                        <img
                            src="/icons/folder.png"
                            alt="Crear escrito"
                            width={20}
                            height={20}
                        />
                        Crear escrito
                    </button>
                    <button
                        className={`${styles.tabButton} ${view === "view-models" ? styles.active : ""}`}
                        onClick={() => setView("view-models")}
                    >
                        <img
                            src="/icons/folder.png"
                            alt="Ver modelos"
                            width={20}
                            height={20}
                        />
                        Ver modelos
                    </button>
                </div>

                <div className={styles.content}>
                    {view === "create" ? (
                        <>
                            <h1 className={styles.mainTitle}>
                                Crear escrito a partir de modelo
                            </h1>

                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    Seleccionar modelo
                                </h2>
                                <select
                                    value={selectedModel?.title || ""}
                                    onChange={(e) => {
                                        const m =
                                            models.find((x) => x.title === e.target.value) ||
                                            null;
                                        setSelectedModel(m);
                                    }}
                                    className="input"
                                    disabled={isProcessing}
                                >
                                    <option value="">Elegir modelo</option>
                                    {models.map((m) => (
                                        <option key={m.title} value={m.title}>
                                            {m.title}
                                        </option>
                                    ))}
                                </select>
                            </section>

                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    Título del escrito
                                </h2>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ej. Recibo de pago"
                                    value={docTitle}
                                    onChange={(e) => setDocTitle(e.target.value)}
                                    disabled={isProcessing}
                                />
                            </section>

                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    Personalizar
                                </h2>
                                <p className={styles.helpText}>
                                    Añadí aquí toda la información real de las partes
                                    involucradas, hechos y derecho aplicable.
                                </p>
                                <textarea
                                    className="input"
                                    rows={6}
                                    placeholder={placeholderText}
                                    value={customInfo}
                                    onChange={(e) => setCustomInfo(e.target.value)}
                                    disabled={isProcessing}
                                />
                            </section>

                            {error && (
                                <p className={styles.errorMessage}>{error}</p>
                            )}

                            <button
                                className={`btn ${styles.actionButton}`}
                                onClick={handleGenerate}
                                disabled={isProcessing}
                            >
                                {isProcessing ? "Generando..." : "Generar escrito"}
                            </button>

                            <p className={styles.costInfo}>
                                El costo aproximado es de {coinsPerToken} ThemiCoins por token.
                            </p>

                            <hr className="divider" />

                            <h2 className={styles.sectionTitle}>
                                Tus escritos personalizados
                            </h2>
                            {documents.length === 0 ? (
                                <p>No tienes escritos aún.</p>
                            ) : (
                                documents.map((doc) => (
                                    <div
                                        key={doc._id}
                                        className={`card ${styles.cardItem}`}
                                    >
                                        <div className={styles.listItemContent}>
                                            <strong>{doc.title}</strong>
                                            <span>
                                                {new Date(doc.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className={styles.listItemActions}>
                                            <button
                                                className="btn"
                                                onClick={() => openDocPopup(doc)}
                                            >
                                                Ver
                                            </button>
                                            <button
                                                className="btn"
                                                onClick={() => handleDelete(doc._id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    ) : (
                        <>
                            <h1 className={styles.mainTitle}>
                                Ver modelos disponibles
                            </h1>
                            <section className={styles.section}>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Buscar modelo"
                                    value={searchModel}
                                    onChange={(e) =>
                                        setSearchModel(e.target.value)
                                    }
                                />
                            </section>
                            {filteredModels.map((m) => (
                                <div
                                    key={m.title}
                                    className={`card-secondary ${styles.cardItem}`}
                                >
                                    <div className={styles.listItemContent}>
                                        <strong>{m.title}</strong>
                                    </div>
                                    <div className={styles.listItemActions}>
                                        <button
                                            className="btn"
                                            onClick={() => openModelPopup(m)}
                                        >
                                            Ver modelo
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
