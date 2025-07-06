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
    // Extraer ID de la ruta usando useParams
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { user, coinsBalance, refreshCoins } = useAuth();

    const [doc, setDoc] = useState<DocumentData | null>(null);
    const [error, setError] = useState<string>("");
    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [isProcessingDelete, setProcessingDelete] = useState(false);

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

    // Mientras carga
    if (!doc && !error) {
        return (
            <div className={`container ${styles.pageContainer}`}>
                <p>Cargando…</p>
            </div>
        );
    }

    // Si hay error
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

    // A estas alturas `doc` ya no es null
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
                    {/* Acá mostramos el título del documento */}
                    <h1 className={styles.mainTitle}>{document.title}</h1>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Modelo</h2>
                        <p>{document.model}</p>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Información personalizada</h2>
                        <p>{document.info}</p>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Contenido generado</h2>
                        {document.content.split("\n").map((line, idx) => (
                            <p key={idx}>{line}</p>
                        ))}
                    </section>

                    <section className={styles.section}>
                        <span>
                            Creado el {new Date(document.createdAt).toLocaleString()}
                        </span>
                    </section>

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
