// src/app/login/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ConsoleEffectWrapper from "@/components/ConsoleEffectWrapper";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/styles/LoginForm.module.css";

export default function LoginPage() {
    const router = useRouter();
    const { user, uniqueCode, signInWithGoogle, signOut } = useAuth();

    // Redirigir a /menu en cuanto tengamos ambos datos
    useEffect(() => {
        if (user && uniqueCode) {
            router.replace("/menu");
        }
    }, [user, uniqueCode, router]);

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Error en login:", error);
        }
    };

    // 1) Si no está logeado, muestro login + efecto
    if (!user) {
        return (
            <>
                <ConsoleEffectWrapper />
                <div className="login-container">
                    <img
                        src="/images/themis-statue.png"
                        alt="Estatua de Themis"
                        className={styles.statue}
                    />
                    <div className={styles.card}>
                        <div className={styles.logoContainer}>
                            <img
                                src="/logo-gold.png"
                                alt="Themis Logo"
                                className={styles.logo}
                            />
                            <h1 className={styles.logoTitle}>Themis</h1>
                            <h2 className={styles.logoSubtitle}>
                                Asistente Legal Inteligente
                            </h2>
                        </div>
                        <div className={styles.socialButtons}>
                            <button
                                onClick={handleGoogleLogin}
                                className={`${styles.btn} ${styles.btnGoogle}`}
                            >
                                Iniciar sesión con Google
                            </button>
                        </div>
                        {/* Pie de página original */}
                        <p className={styles.copyright}>
                            © 2025 Themis Legal Assistant. Software propiedad de Santiago Haspert Piaggio.
                            Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    // 2) Si está logeado pero falta el código, muestro loading
    if (user && !uniqueCode) {
        return (
            <div className="login-container">
                <div className={styles.card}>
                    <p>Cargando perfil…</p>
                </div>
            </div>
        );
    }

    // 3) user && uniqueCode → estamos redirigiendo en useEffect, no renderizamos nada
    return null;
}
