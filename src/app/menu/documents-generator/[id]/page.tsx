// src/app/menu/documents-generator/[id]/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Toolbar from "@/components/Toolbar";
import CoinPurchaseModal from "@/components/CoinPurchaseModal";
import styles from "@/components/styles/DocumentsGenerator.module.css";
import {
    getDocument,
    deleteDocument,
    DocumentData,
} from "@/lib/apiClient";

export default function DocumentDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user, coinsBalance, refreshCoins } = useAuth();

    const [doc, setDoc] = useState<DocumentData | null>(null);
    const [error, setError] = useState<string>("");
    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [isProcessingDelete, setProcessingDelete] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const fetched = await getDocument(id);
                setDoc(fetched);
            } catch (e: any) {
                setError(e.message || "Error cargando el documento");
            }
        })();
    }, [user, id]);

    if (!doc && !error) {
        return (
            <div className={`container ${styles.pageContainer}`}>
                <p>Cargando…</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className={`container ${styles.pageContainer}`}>
                <p className={styles.errorMessage}>{error}</p>
                <button className="btn" onClick={() => router.back()}>
                    ← Volver
                </button>
            </div>
        );
    }

    const document = doc!;

    const handleDelete = async () => {
        setProcessingDelete(true);
        try {
            await deleteDocument(id);
            await refreshCoins();
            router.back();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "No se pudo eliminar");
        } finally {
            setProcessingDelete(false);
        }
    };

    const handleCopy = async () => {
        const textToCopy = `${document.modelTitle}\n\n${document.content
            .split("\n")
            .join(" ")}`;
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // opcional: manejar error de copia
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

                <div className={styles.content}>
                    {/* Título del modelo */}
                    <h1 className={styles.mainTitle}>
                        {document.modelTitle}
                    </h1>

                    {/* Cuerpo en un solo párrafo */}
                    <div className="prose my-4">
                        <p className={styles.documentBodyText}>
                            {document.content.split("\n").join(" ")}
                        </p>
                    </div>

                    {/* Botón Copiar */}
                    <button
                        className={`btn ${styles.actionButton}`}
                        onClick={handleCopy}
                        disabled={copied}
                    >
                        {copied ? "¡Copiado!" : "Copiar texto"}
                    </button>

                    {/* Fecha y coste */}
                    <p className={styles.listItemDate}>
                        Creado el{" "}
                        {new Date(document.createdAt).toLocaleString()}
                    </p>
                    <p className={styles.listItemDate}>
                        ThemiCoins consumidos: {document.coinsCost}
                    </p>

                    <div className={styles.footer}>
                        <button className="btn" onClick={() => router.back()}>
                            ← Volver
                        </button>
                        <button
                            className="btn"
                            onClick={handleDelete}
                            disabled={isProcessingDelete}
                        >
                            {isProcessingDelete ? "Eliminando…" : "Eliminar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
