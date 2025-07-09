// src/components/SignatureWizard.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/styles/SignatureVerification.module.css";
import { uploadImageFile, uploadPdfFile, uploadAudioFile } from "@/lib/uploadToFirebase";
import { getUniqueCertificationCode } from "@/utils/generateCertificationCode";
import { postCertification } from "@/lib/apiClient";

interface PartyData {
    name: string;
    dni: string;
    idFile?: File;         // Archivo de la imagen de ID a subir
    idImageUrl?: string;   // URL resultante tras subir la imagen
    audioBlob?: Blob;      // Blob de la grabación de audio
    audioUrl?: string;     // URL resultante tras subir el audio
    timestamp?: string;    // Fecha/hora ISO al procesar cada party
    ip?: string;           // IP o hostname desde donde firmaron
}

interface SignatureWizardProps {
    onComplete?: (code: string) => void;
}
export default function SignatureWizard({ onComplete }: SignatureWizardProps) {

    const { user, coinsBalance, coinsPerMbStorage, spendCoins } = useAuth();
    const [step, setStep] = useState(1);
    const [pagesCount, setPagesCount] = useState(1);
    const [partiesCount, setPartiesCount] = useState(1);

    const [recordingIndex, setRecordingIndex] = useState<number | null>(null);

    // total de imágenes que se deben subir: páginas + IDs
    const totalImages = pagesCount + partiesCount;

    // Document pages
    const [pageFiles, setPageFiles] = useState<File[]>([]);

    // Parties data
    const [parties, setParties] = useState<PartyData[]>([]);

    // Code, pdf, hash
    const [code, setCode] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [hash, setHash] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Audio recorder reference
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    useEffect(() => {
        // Initialize parties array when partiesCount changes
        setParties(
            Array.from({ length: partiesCount }).map((_, i) => parties[i] || { name: "", dni: "" })
        );
    }, [partiesCount]);

    useEffect(() => {
        if (step === 4 && !code) {
            (async () => {
                try {
                    const unique = await getUniqueCertificationCode();
                    setCode(unique);
                } catch {
                    setError("No se pudo generar un código único.");
                }
            })();
        }
    }, [step]);

    const handleNext = async () => {
        setError(null);
        // Validación básica por paso
        if (step === 1) {
            if (pagesCount < 1 || partiesCount < 1) {
                setError("Debe ingresar al menos 1 página y 1 firmante.");
                return;
            }
        }
        if (step === 2 && pageFiles.length !== pagesCount) {
            setError(`Sube exactamente ${pagesCount} imágenes.`);
            return;
        }
        if (step === 3) {
            for (let i = 0; i < parties.length; i++) {
                if (!parties[i].idFile) {
                    setError(`Sube la imagen de ID para la persona ${i + 1}`);
                    return;
                }
            }
        }
        if (step === 4) {
            for (let i = 0; i < parties.length; i++) {
                if (!parties[i].audioBlob) {
                    setError(`Graba el audio para la persona ${i + 1}`);
                    return;
                }
            }
        }

        if (step < 4) {
            setStep(step + 1);
            return;
        }

        // Si step === 4, cae en el bloque de procesado completo,
        // y al final de ese try…finally haz:
        setStep(5);

        // Paso 5: combinar, hashear, costear, subir y guardar
        setLoading(true);
        try {
            // 1) Combinar páginas en PDF
            const buffers: Uint8Array[] = await Promise.all(
                pageFiles.map(f => f.arrayBuffer().then(buf => new Uint8Array(buf)))
            );
            const pdfDoc = await PDFDocument.create();
            for (const buf of buffers) {
                const img = await pdfDoc.embedJpg(buf).catch(() => pdfDoc.embedPng(buf));
                const page = pdfDoc.addPage([img.width, img.height]);
                page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
            }
            const pdfBytes = await pdfDoc.save();

            // 2) Calcular hash SHA-256
            const digest = await crypto.subtle.digest("SHA-256", pdfBytes);
            const hashHex = Array.from(new Uint8Array(digest))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");

            // 3) Calcular coste por almacenamiento prolongado
            const pagesMb = pageFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
            const idsMb = parties.reduce((sum, p) => sum + (p.idFile?.size || 0), 0) / (1024 * 1024);
            const audioMb = parties.reduce((sum, p) => sum + (p.audioBlob?.size || 0), 0) / (1024 * 1024);
            const pdfMb = pdfBytes.byteLength / (1024 * 1024);
            const totalMb = pagesMb + idsMb + audioMb + pdfMb;

            const cost = Math.ceil(totalMb * coinsPerMbStorage);
            if (coinsBalance < cost) {
                throw new Error("Saldo insuficiente para almacenar este certificado.");
            }

            // 4) Descontar monedas antes de subir
            await spendCoins(cost);

            // 5) Subir PDF
            const pdfFile = new File([pdfBytes], `${Date.now()}.pdf`, { type: "application/pdf" });
            const uploadedPdfUrl = await uploadPdfFile(pdfFile, user!.uid);

            // 6) Subir ID y audios
            const enrichedParties = await Promise.all(parties.map(async p => {
                const idUrl = await uploadImageFile(p.idFile!, user!.uid);
                const audioFile = new File([p.audioBlob!], `${Date.now()}.webm`, { type: "audio/webm" });
                // Después
                const audioUrl = await uploadAudioFile(audioFile, user!.uid);

                return {
                    ...p,
                    idImageUrl: idUrl,
                    audioUrl,
                    timestamp: new Date().toISOString(),
                    ip: window.location.hostname,
                };
            }));

            // 7) Generar código de certificación
            const generatedCode = code;

            // 8) Guardar en backend
            const saved = await postCertification({
                code: generatedCode,      // ó simplemente `code`
                pdfUrl: uploadedPdfUrl,
                hash: hashHex,
                parties: enrichedParties
            });

            // 9) Actualizar estado con resultado
            setCode(saved.code);
            setPdfUrl(uploadedPdfUrl);
            setHash(saved.hash);

            // Notificamos al padre y luego avanzamos al paso 5
            onComplete?.(saved.code);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
            setStep(5);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        <div className={styles.wizardContainer}>
            <h1 className={styles.mainTitle}>Certificación digital avanzada de firmas con seguridad criptográfica y biométrica.</h1>
            {error && <p className={styles.errorMessage}>{error}</p>}
            {/* Step indicator */}
            <div className={styles.stepIndicator}>Paso {step} de 5</div>

            {/* Steps */}
            {step === 1 && (
                <div className={styles.section}>
                    <label htmlFor="pagesCount">Páginas del documento:</label>
                    <div className={styles.numberInputWrapper}>
                        <button
                            type="button"
                            className={styles.decrementBtn}
                            onClick={() => setPagesCount(pc => Math.max(1, pc - 1))}
                        >
                            −
                        </button>
                        <input
                            id="pagesCount"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={pagesCount}
                            onChange={e => setPagesCount(Math.max(1, +e.target.value))}
                            className={styles.plainNumber}
                        />
                        <button
                            type="button"
                            className={styles.incrementBtn}
                            onClick={() => setPagesCount(pc => pc + 1)}
                        >
                            +
                        </button>
                    </div>

                    <label htmlFor="partiesCount">Firmantes (partes involucradas):</label>
                    <div className={styles.numberInputWrapper}>
                        <button
                            type="button"
                            className={styles.decrementBtn}
                            onClick={() => setPartiesCount(pc => Math.max(1, pc - 1))}
                        >
                            −
                        </button>
                        <input
                            id="partiesCount"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={partiesCount}
                            onChange={e => setPartiesCount(Math.max(1, +e.target.value))}
                            className={styles.plainNumber}
                        />

                        <button
                            type="button"
                            className={styles.incrementBtn}
                            onClick={() => setPartiesCount(pc => pc + 1)}
                        >
                            +
                        </button>
                    </div>
                    {/* ↓ Aquí insertas el detalle de coste ↓ */}
                    <p className={styles.costInfo}>
                        Costo por certificación: <strong>{coinsPerMbStorage} ThemiCoins</strong> por MB
                    </p>
                </div>
            )}

            {step === 2 && (
                <div className={styles.section}>
                    <p>
                        Sube <strong>{pagesCount}</strong> imágenes en total: una por cada página del documento
                        que deseas certificar.
                        (máx. 1MB por imagen).
                    </p>

                    {/* Aquí agregamos el párrafo con los formatos permitidos */}
                    <p className={styles.allowedFormats}>
                        <em>Formatos permitidos:</em> PNG, JPG o JPEG.
                    </p>

                    {/* Botón para comprimir imágenes */}
                    <button
                        type="button"
                        className={styles.compressBtn}
                        onClick={() =>
                            window.open(
                                "https://www.iloveimg.com/compress-image",
                                "_blank",
                                "noopener noreferrer"
                            )
                        }
                    >
                        Si tus imágenes exceden el peso máximo, <u>comprimelas aquí</u>
                    </button>

                    <input
                        type="file"
                        accept="image/png, image/jpeg"
                        multiple
                        onChange={e =>
                            setPageFiles(Array.from(e.target.files || []).slice(0, pagesCount))
                        }
                    />
                    <div className={styles.previewGrid}>
                        {pageFiles.map((file, i) => (
                            <img
                                key={i}
                                src={URL.createObjectURL(file)}
                                alt={`Página ${i + 1}`}
                                className={styles.previewImage}
                            />
                        ))}
                    </div>
                </div>
            )}


            {step === 3 && (
                <div className={styles.section}>
                    <p>Sube la imagen de DNI o pasaporte de cada firmante:</p>
                    {parties.map((p, i) => (
                        <div key={i} className={styles.partyInput}>
                            <p>Firmante {i + 1}:</p>
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                value={p.name}
                                onChange={e => {
                                    const arr = [...parties];
                                    arr[i].name = e.target.value;
                                    setParties(arr);
                                }}
                            />
                            <input
                                type="text"
                                placeholder="DNI"
                                value={p.dni}
                                onChange={e => {
                                    const arr = [...parties];
                                    arr[i].dni = e.target.value;
                                    setParties(arr);
                                }}
                            />
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const arr = [...parties];
                                        arr[i].idFile = file;
                                        setParties(arr);
                                    }
                                }}
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        className={styles.compressBtn}
                        onClick={() =>
                            window.open(
                                "https://www.iloveimg.com/compress-image",
                                "_blank",
                                "noopener noreferrer"
                            )
                        }
                    >
                        Si tus imágenes exceden el peso máximo, <u>comprimelas aquí</u>
                    </button>
                </div>
            )}

            {step === 4 && (
                <div className={styles.section}>
                    <p>Graba el audio de firma para cada firmante (máx 1 minuto):</p>
                    {parties.map((p, i) => (
                        <div key={i} className={styles.partyInput}>
                            <p>Firmante {i + 1}:</p>
                            {/* Instrucción de lectura con el código generado */}
                            <p className={styles.readAloudText}>
                                “Yo <strong>{p.name} D.N.I. número {p.dni}</strong>, en este acto y a la fecha de hoy,
                                reconozco la autenticidad de la firma autógrafa presente en el documento
                                asociado a la clave de verificación <strong>{code}</strong>.”
                            </p>

                            {/* Botones de grabación */}
                            {recordingIndex === i ? (
                                <button
                                    className="btn"
                                    onClick={() => {
                                        mediaRecorderRef.current?.stop();
                                        setRecordingIndex(null);
                                    }}
                                >
                                    Detener
                                </button>
                            ) : (
                                <button
                                    className="btn"
                                    onClick={async () => {
                                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                        const recorder = new MediaRecorder(stream);
                                        const chunks: Blob[] = [];
                                        recorder.ondataavailable = e => chunks.push(e.data);
                                        recorder.onstop = () => {
                                            const blob = new Blob(chunks, { type: 'audio/webm' });
                                            const arr = [...parties];
                                            arr[i].audioBlob = blob;
                                            arr[i].audioUrl = URL.createObjectURL(blob);
                                            setParties(arr);
                                        };
                                        mediaRecorderRef.current = recorder;
                                        recorder.start();
                                        setRecordingIndex(i);
                                        setTimeout(() => {
                                            if (mediaRecorderRef.current?.state === 'recording') {
                                                mediaRecorderRef.current.stop();
                                                setRecordingIndex(null);
                                            }
                                        }, 60000);
                                    }}
                                >
                                    Grabar
                                </button>
                            )}

                            {recordingIndex === i && <span style={{ marginLeft: '1rem' }}>⏺ Grabando…</span>}

                            {/* Reproductor */}
                            {p.audioUrl && (
                                <audio
                                    className={styles.audioPlayer}
                                    controls
                                    src={p.audioUrl}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}


            {step === 5 && (
                <div className={styles.section}>
                    <p>Su certificado se está procesando. Por favor espere...</p>
                    {loading ? (
                        <p>Cargando...</p>
                    ) : pdfUrl ? (
                        <div>
                            <p>
                                Código generado: <strong>{code}</strong>
                            </p>
                            <button
                                className="btn"
                                onClick={() => onComplete?.(code)}
                            >
                                Ver certificado completo
                            </button>
                        </div>
                    ) : (
                        <button className="btn" onClick={handleNext}>
                            Confirmar y generar
                        </button>
                    )}
                </div>
            )}

            <div className={styles.navButtons}>
                {step > 1 && step < 5 && (
                    <button className="btn" onClick={handleBack} disabled={loading}>
                        Atrás
                    </button>
                )}
                {step < 5 && (
                    <button className="btn" onClick={handleNext} disabled={loading}>
                        {step < 4 ? 'Siguiente' : 'Finalizar'}
                    </button>
                )}
            </div>
        </div>
    );
}