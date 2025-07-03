// src/components/Popup.tsx

import React, { ReactNode, useEffect } from "react";
import styles from "@/components/styles/Popup.module.css";

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    width?: string;
    height?: string;
    zIndex?: number;
}

export default function Popup({
    isOpen,
    onClose,
    children,
    width = "400px",
    height = "auto",
    zIndex = 1000,
}: PopupProps) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className={styles.modalOverlay}
            style={{ zIndex }}
            onClick={onClose}
            aria-modal="true"
        >
            <div
                className={styles.modalContainer}
                style={{ width, height }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className={styles.modalCloseBtn}
                    onClick={onClose}
                    aria-label="Close"
                >
                    ✕
                </button>
                <div className={styles.modalContent}>
                    {children}
                </div>
            </div>
        </div>
    );
}
