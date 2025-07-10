// src/app/login/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConsoleEffectWrapper from "@/components/ConsoleEffectWrapper";
import { useAuth } from "@/context/AuthContext";
import Popup from "@/components/Popup";
import styles from "@/components/styles/LoginForm.module.css";
import terms from "@/data/terms/termsAndConditions.json";

export default function LoginPage() {
    const router = useRouter();
    const { user, uniqueCode, signInWithGoogle } = useAuth();
    const [accepted, setAccepted] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [error, setError] = useState("");

    // Redirigir a /menu en cuanto tengamos ambos datos
    useEffect(() => {
        if (user && uniqueCode) {
            router.replace("/menu");
        }
    }, [user, uniqueCode, router]);

    const handleGoogleLogin = async () => {
        if (!accepted) {
            setError("Debes aceptar los Términos y Condiciones");
            return;
        }
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Error en login:", error);
        }
    };

    // Contenido del pop-up de Términos y Condiciones
    const renderTermsContent = () => (
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <h2>{terms.title}</h2>
            <p><em>Fecha de última actualización: {terms.lastUpdated}</em></p>
            {terms.sections.map(section => (
                <div key={section.id} style={{ marginBottom: '1rem' }}>
                    <h3>{section.heading}</h3>
                    <p>{section.content}</p>
                </div>
            ))}
        </div>
    );

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

                        <div className={styles.termsCheckbox}>
                            <input
                                type="checkbox"
                                id="acceptTerms"
                                checked={accepted}
                                onChange={() => { setAccepted(!accepted); setError(""); }}
                            />
                            <label htmlFor="acceptTerms">
                                Declaro haber leído y aceptado los{' '}
                                <button
                                    type="button"
                                    onClick={() => setIsPopupOpen(true)}
                                    style={{
                                        textDecoration: 'underline',
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        color: 'inherit',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Términos y Condiciones
                                </button>
                            </label>
                        </div>

                        {error && (
                            <p style={{ color: 'red', textAlign: 'center', marginTop: '0.5rem' }}>
                                {error}
                            </p>
                        )}

                        <p className={styles.copyright}>
                            © 2025 Themis Legal Assistant. Software propiedad de Santiago Haspert
                            Piaggio. Todos los derechos reservados.
                        </p>

                        <Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)}>
                            {renderTermsContent()}
                        </Popup>
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