// src/components/Toolbar.tsx

import React from "react";
import styles from "@/components/styles/Toolbar.module.css";

interface ToolbarProps {
    balance: number;
    onBack?: () => void;
    onBuy?: () => void;
}

export default function Toolbar({
    balance,
    onBack,
    onBuy,
}: ToolbarProps) {
    return (
        <header className={styles.toolbar}>
            <div className={styles.left}>
                {onBack && (
                    <button className={styles.backBtn} onClick={onBack}>
                        ← Volver
                    </button>
                )}
            </div>
            <div className={styles.right}>
                <span className={styles.balance}>
                    <span className={styles.coin}>💰</span>
                    {balance.toFixed(2)}
                </span>
                {onBuy && (
                    <button className={styles.toolbarBuyBtn} onClick={onBuy}>
                        + Comprar
                    </button>
                )}
            </div>
        </header>
    );
}
