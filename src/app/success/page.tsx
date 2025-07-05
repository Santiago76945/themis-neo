// src/app/success/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/styles/SuccessPage.module.css";

export default function SuccessPage() {
    const { refreshCoins } = useAuth();
    const router = useRouter();
    const [returnTo, setReturnTo] = useState<string | null>(null);

    useEffect(() => {
        // Refresca el balance tras la compra/webhook
        refreshCoins();
        // Leemos la ruta guardada
        const last = sessionStorage.getItem("returnTo");
        setReturnTo(last);
        sessionStorage.removeItem("returnTo");
    }, [refreshCoins]);

    const handleBack = () => {
        if (returnTo) {
            router.push(returnTo);
        } else {
            router.push("/");
        }
    };

    return (
        <div className={styles.successPageContainer}>
            <div className={styles.successPageCard}>
                <h1 className={styles.successPageTitle}>✅ ¡Gracias por tu compra!</h1>
                <p className={styles.successPageMessage}>
                    Tu transacción se ha completado exitosamente. Tu saldo de ThemiCoins se ha actualizado.
                </p>
                <button
                    className={styles.successPageButton}
                    onClick={handleBack}
                >
                    Volver al sitio
                </button>
            </div>
        </div>
    );
}
