// src/app/success/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/styles/SuccessPage.module.css";

export default function SuccessPage() {
    const { refreshCoins } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Refresca el balance tras la compra/webhook
        refreshCoins();
    }, [refreshCoins]);

    return (
        <div className={styles.successPageContainer}>
            <div className={styles.successPageCard}>
                <h1 className={styles.successPageTitle}>✅ ¡Gracias por tu compra!</h1>
                <p className={styles.successPageMessage}>
                    Tu transacción se ha completado exitosamente. Tu saldo de ThemiCoins se ha actualizado.
                </p>
                <button
                    className={styles.successPageButton}
                    onClick={() => router.push("/menu/audio-transcription")}
                >
                    Volver a Transcripciones
                </button>
            </div>
        </div>
    );
}
