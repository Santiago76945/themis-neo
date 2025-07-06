// src/app/menu/documents-generator/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Toolbar from "@/components/Toolbar";
import CoinPurchaseModal from "@/components/CoinPurchaseModal";
import styles from "@/components/styles/DocumentsGenerator.module.css";
import {
    getDocuments,
    postDocument,
    deleteDocument,
    DocumentData,
} from "@/lib/apiClient";

export default function DocumentsGeneratorPage() {
    const router = useRouter();
    const { user, coinsBalance, refreshCoins } = useAuth();

    // Tarifa por token
    const coinsPerToken = parseFloat(process.env.NEXT_PUBLIC_COINS_PER_TOKEN || "0");

    const [models, setModels] = useState<{ title: string; content: string }[]>([]);
    const [view, setView] = useState<"create" | "view-models">("create");
    const [searchModel, setSearchModel] = useState<string>("");
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [customInfo, setCustomInfo] = useState<string>("");
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [error, setError] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState<boolean>(false);

    useEffect(() => {
        if (!user) return; // Esperar a que el usuario esté autenticado

        refreshCoins();

        // Cargar modelos dinámicamente
        (async () => {
            try {
                const res = await fetch("/api/document-models");
                const data: { title: string; content: string }[] = await res.json();
                setModels(data);
            } catch (e) {
                console.error("Error cargando modelos:", e);
            }
        })();

        // Cargar documentos existentes
        (async () => {
            try {
                const docs = await getDocuments();
                setDocuments(docs);
            } catch (e) {
                console.error("Error cargando escritos:", e);
            }
        })();
    }, [user]);

    // Filtrar y ordenar modelos
    const filteredModels = models
        .filter((m) => m.title.toLowerCase().includes(searchModel.toLowerCase()))
        .sort((a, b) => a.title.localeCompare(b.title));

    const handleGenerate = async () => {
        setError("");
        if (!selectedModel) {
            setError("Por favor selecciona un modelo.");
            return;
        }
        if (coinsBalance <= 0) {
            setError("Saldo insuficiente. Compra ThemiCoins.");
            setPurchaseModalOpen(true);
            return;
        }

        setIsProcessing(true);
        try {
            const created = await postDocument({ model: selectedModel, info: customInfo });
            setDocuments((prev) => [created, ...prev]);
            router.push(`/menu/documents-generator/${created._id}`);
        } catch (e: any) {
            console.error("Error generando escrito:", e);
            setError(e.message || "Ocurrió un error.");
        } finally {
            setIsProcessing(false);
            await refreshCoins();
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDocument(id);
            setDocuments((prev) => prev.filter((d) => d._id !== id));
        } catch (e) {
            console.error("Error eliminando escrito:", e);
        }
    };

    return (
        <div className={`container ${styles.pageContainer}`}>            
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
                        <img src="/icons/folder.png" alt="Crear escrito" width={20} height={20} />
                        Crear escrito
                    </button>
                    <button
                        className={`${styles.tabButton} ${view === "view-models" ? styles.active : ""}`}
                        onClick={() => setView("view-models")}
                    >
                        <img src="/icons/folder.png" alt="Ver modelos" width={20} height={20} />
                        Ver modelos
                    </button>
                </div>

                <div className={styles.content}>
                    {view === "create" ? (
                        <>
                            <h1 className={styles.mainTitle}>Crear escrito a partir de modelo</h1>
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Seleccionar modelo</h2>
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="input"
                                    disabled={isProcessing}
                                >
                                    <option value="">Elegir modelo</option>
                                    {models.map((m) => (
                                        <option key={m.title} value={m.content}>
                                            {m.title}
                                        </option>
                                    ))}
                                </select>
                            </section>

                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Personalizar</h2>
                                <p className={styles.helpText}>
                                    Añadí aquí toda la información real de las partes involucradas,
                                    hechos y derecho aplicable.
                                </p>
                                <textarea
                                    className="input"
                                    rows={6}
                                    value={customInfo}
                                    onChange={(e) => setCustomInfo(e.target.value)}
                                    placeholder="Información a personalizar..."
                                    disabled={isProcessing}
                                />
                            </section>

                            {error && <p className={styles.errorMessage}>{error}</p>}

                            <button
                                className={`btn ${styles.actionButton}`}
                                onClick={handleGenerate}
                                disabled={isProcessing}
                            >
                                {isProcessing ? "Generando..." : "Generar escrito"}
                            </button>

                            {/* Mensaje de coste por token */}
                            <p className={styles.costInfo}>
                                El costo aproximado es de {coinsPerToken} ThemiCoins por token.
                            </p>

                            <hr className="divider" />

                            <h2 className={styles.sectionTitle}>Tus escritos personalizados</h2>
                            {documents.length === 0 ? (
                                <p>No tienes escritos aún.</p>
                            ) : (
                                documents.map((doc) => (
                                    <div key={doc._id} className={`card ${styles.cardItem}`}>
                                        <div className={styles.listItemContent}>
                                            <strong>{doc.model}</strong>
                                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className={styles.listItemActions}>
                                            <button
                                                className="btn"
                                                onClick={() =>
                                                    router.push(
                                                        `/menu/documents-generator/${doc._id}`
                                                    )
                                                }
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
                            <h1 className={styles.mainTitle}>Ver modelos disponibles</h1>
                            <section className={styles.section}>
                                <input
                                    type="text"
                                    placeholder="Buscar modelo"
                                    value={searchModel}
                                    onChange={(e) => setSearchModel(e.target.value)}
                                    className="input"
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
                                            onClick={() => {
                                                setSelectedModel(m.content);
                                                setView("create");
                                            }}
                                        >
                                            Seleccionar
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
