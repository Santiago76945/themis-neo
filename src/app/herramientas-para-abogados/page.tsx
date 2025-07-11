// src/app/herramientas-para-abogados/page.tsx

"use client";
import React from 'react';
import Link from 'next/link';
import styles from '@/components/styles/HerramientasParaAbogados.module.css';

export default function HerramientasParaAbogados() {
    return (
        <div className={`${styles.root} container`}>
            {/* Hero responsive con tres imágenes */}
            <picture style={{ display: 'block', width: '100vw', margin: '0 calc(50% - 50vw)' }}>
                {/* Muy anchas */}
                <source
                    srcSet="/images/hero-image-large.png"
                    media="(min-width: 1280px)"
                />
                {/* Pantallas medias */}
                <source
                    srcSet="/images/hero-image-horizontal.png"
                    media="(min-width: 768px)"
                />
                {/* Móviles (fallback) */}
                <img
                    src="/images/hero-image-vertical.png"
                    alt="Themis: visión de la plataforma"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                />
            </picture>


            {/* Encabezado magistral */}
            <header className={`${styles.header}`}>
                <h1>Themis: El Futuro de la Práctica Jurídica</h1>
            </header>

            <p>
                Herramientas para abogados, diseñadas por abogados. Tecnología de vanguardia, accesible y fácil de usar. Incorporamos lo último en inteligencia artificial para simplificar tus tareas jurídicas diarias y llevar tu estudio jurídico al siguiente nivel.
            </p>

            {/* Funcionalidades estelares */}
            <section className={`${styles.section} card-secondary`}>
                <img
                    src="/images/voice-to-text.PNG"
                    alt="Transcripción de audio a texto"
                    className={styles.sectionImage}
                />
                <h2 className={styles.sectionTitle}>🔊 TRANSCRIPCIÓN DE AUDIO A TEXTO</h2>
                <p className={styles.sectionText}>
                    Themis escucha todo lo que necesitas. Y a diferencia de otros asistentes, no pierde detalle alguno. Porque sabemos muchas veces “las palabras se las lleva el viento”, ¿qué mejor que nuestro asistente para no perderte ningún detalle? Convierte rápidamente una llamada importante, una audiencia judicial o cualquier conversación clave de audio a texto en segundos. No es magia, es tecnología avanzada diseñada específicamente para agilizar tus tareas y permitirte centrarte en lo verdaderamente importante. Solo danos tu archivo de audio y deja que Themis haga el resto: ¡tendrás una copia en texto de cualquier audio que necesites!
                </p>
            </section>

            <section className={`${styles.section} card-secondary`}>
                <img
                    src="/images/contracts-generator.PNG"
                    alt="Creación de documentos con IA"
                    className={styles.sectionImage}
                />
                <h2 className={styles.sectionTitle}>📝 CREACIÓN DE DOCUMENTOS CON IA</h2>
                <p className={styles.sectionText}>
                    ¿Al redactar un escrito cuántas veces has repetido las mismas fórmulas legales una y otra vez? ¿Cuánto tiempo has perdido buscando modelos que se adapten exactamente a tu caso? Con Themis, esto es historia pasada. Hemos equipado nuestra plataforma con diversos modelos jurídicos listos para usar (y nuestra librería crece día a día). Pero no nos detenemos ahí: gracias a su tecnología de inteligencia artificial de última generación, Themis crea documentos personalizados adaptados perfectamente a cada caso. Elige tu modelo, proporciona los detalles específicos y en segundos tendrás un escrito único, elaborado especialmente para ti. Es así de sencillo: los modelos de Themis hacen lo imposible posible.
                </p>
            </section>

            <section className={`${styles.section} card-secondary`}>
                <img
                    src="/images/signature-certification.PNG"
                    alt="Certificación digital de firmas"
                    className={styles.sectionImage}
                />
                <h2 className={styles.sectionTitle}>🔐 CERTIFICACIÓN DIGITAL AVANZADA DE FIRMAS</h2>
                <p className={styles.sectionText}>
                    Themis presenta su propio sistema de certificación digital avanzada, combinando seguridad criptográfica y biométrica en una sola herramienta rápida, segura y sencilla. ¿Buscas proteger y validar documentos importantes de forma económica y confiable? Ya sean documentos externos o generados mediante la creación inteligente de documentos de Themis, nuestra plataforma garantiza la integridad y autenticidad con una certificación robusta y única. Solo necesitas tomar un par de fotos, grabar tu voz confirmando la firma y listo: Themis genera un código fácil de usar para que cualquier persona pueda verificar la autenticidad de la firma en cualquier momento. Seguridad total, accesible y económica en minutos.
                </p>
            </section>

            {/* Separador elegante */}
            <hr className="divider" />

            {/* Llamados a la acción */}
            <div className={styles.actions}>
                <Link href="/login" className="btn">
                    Crear cuenta / Iniciar sesión
                </Link>
            </div>
        </div>
    );
}