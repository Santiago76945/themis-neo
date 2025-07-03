// src/components/CoinPurchaseModal.tsx

"use client";

import React from "react";
import Popup from "./Popup";
import styles from "@/components/styles/CoinPurchaseModal.module.css";

interface Package {
    id: string;
    label: string;
    amount: number;
    price: string;
    note: string;
    imageSrc: string;
}

const PACKAGES: Package[] = [
    { id: "basic",   label: "100 ThemiCoins",  amount: 100,  price: "$1499.99", note: "Prueba la magia ✨",   imageSrc: "/images/coins-basic.png" },
    { id: "popular", label: "500 ThemiCoins",  amount: 500,  price: "$4.999",   note: "Favorito de usuarios 💚", imageSrc: "/images/coins-popular.png" },
    { id: "premium", label: "1000 ThemiCoins", amount: 1000, price: "$8999.99", note: "Máximo ahorro 🏆",     imageSrc: "/images/coins-premium.png" },
];

interface CoinPurchaseModalProps {
    visible: boolean;
    onClose: () => void;
    onPurchase: (amount: number) => void;
}

export default function CoinPurchaseModal({
    visible,
    onClose,
    onPurchase,
}: CoinPurchaseModalProps) {
    if (!visible) return null;

    return (
        <Popup isOpen={visible} onClose={onClose} width="800px" zIndex={2000}>
            <h2 className={styles.coinHeader}>🚀 Comprar ThemiCoins</h2>

            <div className={styles.coinBody}>
                {PACKAGES.map((pkg) => (
                    <div key={pkg.id} className={styles.coinPackageCard}>
                        <img
                            src={pkg.imageSrc}
                            alt={pkg.label}
                            className={styles.coinPackageImage}
                        />
                        <p className={styles.coinPackageLabel}>{pkg.label}</p>
                        <p className={styles.coinPackageNote}>{pkg.note}</p>
                        <p className={styles.coinPackagePrice}>{pkg.price}</p>
                        <button
                            className={styles.coinPackageBtn}
                            onClick={() => onPurchase(pkg.amount)}
                        >
                            Obtener
                        </button>
                        {/* Logo de Mercado Pago */}
                        <img
                            src="/images/mercadopago.svg"
                            alt="Mercado Pago Logo"
                            className={styles.mercadoPagoLogo}
                        />
                    </div>
                ))}
            </div>

            <div className={styles.coinExplanation}>
                ¿Tienes grabaciones de audio —una llamada clave con un cliente o la reunión de tu equipo capturada en tu app de notas de voz?  
                Con <strong>Themis AI</strong> convierte esos archivos en texto en segundos, ¡como por arte de magia!
            </div>

            <div className={styles.coinFooter}>
                <button
                    className={styles.coinFooterCloseBtn}
                    onClick={onClose}
                >
                    Cerrar
                </button>
            </div>
        </Popup>
    );
}
