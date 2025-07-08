// src/app/menu/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import styles from "@/components/styles/Menu.module.css";

export default function MenuPage() {
    const router = useRouter();
    const { user, uniqueCode, signOut } = useAuth();

    // Si no hay sesión, redirigir al login
    useEffect(() => {
        if (!user) router.replace("/login");
    }, [user, router]);

    // Mientras carga user o uniqueCode
    if (!user || !uniqueCode) {
        return (
            <div className="container">
                <p>Cargando menú...</p>
            </div>
        );
    }

    // Preparar datos de usuario para el menú
    const [firstName, ...rest] = user.displayName?.split(" ") || ["Usuario"];
    const lastName = rest.join(" ");
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : user.displayName || "Usuario";

    const menuItems = [
        { label: "Transcripción de audio a texto", icon: "/icons/audio-icon.png", path: "/menu/audio-transcription", enabled: true },
        {
            label: "Creación de documentos con AI",
            icon: "/icons/writing-icon.png",
            path: "/menu/documents-generator",
            enabled: true
        },
                {
            label: "Certificación digital de firmas",
            icon: "/icons/signature-icon.png",
            path: "/menu/documents-generator",
            enabled: false
        },
                {
            label: "Themis AI - Asistente personal",
            icon: "/icons/themis-icon.png",
            path: "/menu/documents-generator",
            enabled: false
        },
        
        { label: "Gestión de clientes", icon: "/icons/clients-icon.png", path: "/menu/clientes", enabled: false },
        { label: "Gestión de casos", icon: "/icons/court-file-icon.png", path: "/menu/casos", enabled: false },
        { label: "Gestión de tareas", icon: "/icons/tasks-icon.png", path: "/menu/tasks", enabled: false },
        { label: "Finanzas del estudio", icon: "/icons/finances-icon.png", path: "/menu/finanzas", enabled: false },
        { label: "Calendario", icon: "/icons/calendar-icon.png", path: "/menu/agenda", enabled: false },
    ];

    return (
        <div className="container">
            <div className={`card ${styles.menuCard}`}>
                <header className={styles.menuHeader}>
                    <h1 className={styles.menuTitle}>Dashboard</h1>
                    <p className={styles.menuSubtitle}>
                        ¡Hola, Dr. {fullName}! Bienvenido a Themis.<br />
                        Tu código de usuario es: <strong>{uniqueCode}</strong>
                    </p>
                    <button className="btn btn-link" onClick={signOut}>
                        Cerrar sesión
                    </button>
                </header>

                <nav className={styles.menuNav}>
                    {menuItems.map((item, idx) => (
                        <div key={idx} className={styles.menuItem}>
                            <button
                                className={`btn ${styles.menuButton}`}
                                disabled={!item.enabled}
                                onClick={() => item.enabled && item.path && router.push(item.path)}
                            >
                                <Image
                                    src={item.icon}
                                    alt={`${item.label} icon`}
                                    width={48}
                                    height={48}
                                    className={styles.icon}
                                />
                                <span className={styles.menuLabel}>{item.label}</span>
                                {!item.enabled && <div className={styles.badge}>Próximamente</div>}
                            </button>
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    );
}
