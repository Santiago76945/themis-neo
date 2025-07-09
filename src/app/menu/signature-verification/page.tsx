// src/app/menu/signature-verification/page.tsx

"use client";

import React, { useState } from "react";
import Toolbar from "@/components/Toolbar";
import CoinPurchaseModal from "@/components/CoinPurchaseModal";
import SignatureWizard from "@/components/SignatureWizard";
import styles from "@/components/styles/SignatureVerification.module.css";
import { useAuth } from "@/context/AuthContext";
import { getCertification } from "@/lib/apiClient";

interface Certification {
    code: string;
    pdfUrl: string;
    hash: string;
    parties: Array<{
        name: string;
        dni: string;
        idImageUrl: string;
        audioUrl: string;
        timestamp: string;
        ip: string;
    }>;
    createdAt: Date;
}

export default function SignatureVerificationPage() {
    const { coinsBalance, buyCoins } = useAuth();
    const [view, setView] = useState<"create" | "consult">("create");
    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);

    // State for consult
    const [codeQuery, setCodeQuery] = useState("");
    const [cert, setCert] = useState<Certification | null>(null);
    const [loadingCert, setLoadingCert] = useState(false);
    const [errorCert, setErrorCert] = useState<string | null>(null);

    const handleConsult = async () => {
        setErrorCert(null);
        setCert(null);
        setLoadingCert(true);
        try {
            // Usamos helper con auth automática
            const data = await getCertification(codeQuery);
            setCert(data);
        } catch (err: any) {
            if (err.message === "Saldo insuficiente") {
                setErrorCert("No tienes suficientes monedas para consultar.");
            } else {
                setErrorCert(err.message);
            }
        } finally {
            setLoadingCert(false);
        }
    };

    return (
        <div className={`container ${styles.pageContainer}`}>
            <CoinPurchaseModal
                visible={isPurchaseModalOpen}
                onClose={() => setPurchaseModalOpen(false)}
                onPurchase={async (amount) => {
                    await buyCoins(amount);
                    setPurchaseModalOpen(false);
                }}
            />

            <div className={`card ${styles.cardWrapper}`}>
                <Toolbar
                    balance={coinsBalance}
                    onBack={() => window.history.back()}
                    onBuy={() => setPurchaseModalOpen(true)}
                />

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabButton} ${view === "create" ? styles.active : ""
                            }`}
                        onClick={() => setView("create")}
                    >
                        <img
                            src="/icons/folder.png"
                            alt="Crear certificación"
                            width={20}
                            height={20}
                        />
                        Crear certificación
                    </button>
                    <button
                        className={`${styles.tabButton} ${view === "consult" ? styles.active : ""
                            }`}
                        onClick={() => setView("consult")}
                    >
                        <img
                            src="/icons/folder.png"
                            alt="Consultar certificación"
                            width={20}
                            height={20}
                        />
                        Consultar certificación
                    </button>
                </div>

                <div className={styles.content}>
                    {view === "create" ? (
                        <SignatureWizard />
                    ) : (
                        <section>
                            <h1 className={styles.mainTitle}>Consultar certificación</h1>
                            <div className={styles.section}>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Código de certificación (8 dígitos)"
                                    value={codeQuery}
                                    onChange={(e) => setCodeQuery(e.target.value)}
                                    maxLength={8}
                                />
                                <button
                                    className="btn"
                                    onClick={handleConsult}
                                    disabled={loadingCert || !codeQuery.trim()}
                                >
                                    {loadingCert ? "Cargando..." : "Buscar"}
                                </button>
                            </div>

                            {errorCert && (
                                <p className={styles.errorMessage}>{errorCert}</p>
                            )}

                            {cert && (
                                <div className={styles.section}>
                                    <h2 className={styles.sectionTitle}>
                                        Certificado {cert.code}
                                    </h2>
                                    <a
                                        href={cert.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Ver PDF combinado
                                    </a>
                                    <p>Hash: {cert.hash}</p>
                                    <p>Creado el: {cert.createdAt.toLocaleString()}</p>
                                    <h3 className={styles.sectionTitle}>Firmantes</h3>
                                    {cert.parties.map((p, i) => (
                                        <div key={i} className={styles.partyBlock}>
                                            <p>
                                                <strong>Nombre:</strong> {p.name}
                                            </p>
                                            <p>
                                                <strong>DNI:</strong> {p.dni}
                                            </p>
                                            <p>
                                                <strong>Timestamp:</strong>{" "}
                                                {new Date(p.timestamp).toLocaleString()}
                                            </p>
                                            <p>
                                                <strong>IP:</strong> {p.ip}
                                            </p>
                                            <div>
                                                <p>Imagen de ID:</p>
                                                <img
                                                    src={p.idImageUrl}
                                                    alt={`DNI de ${p.name}`}
                                                    className={styles.idImage}
                                                />
                                            </div>
                                            <div>
                                                <p>Audio de firma:</p>
                                                <audio controls src={p.audioUrl} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

