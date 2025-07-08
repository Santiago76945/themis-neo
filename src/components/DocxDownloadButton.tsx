// src/components/DocxDownloadButton.tsx

import React, { useState } from "react";
import { saveAs } from "file-saver";
import { generateDocFromJSON } from "@/utils/generateDoc";

interface DownloadButtonProps {
    /** Texto del título dentro del documento (título del modelo) */
    documentTitle: string;
    /** Cuerpo del documento */
    body: string;
    /** Nombre de archivo .docx (sin extensión) */
    fileName?: string;
}

export default function DocxDownloadButton({
    documentTitle,
    body,
    fileName,
}: DownloadButtonProps) {
    const [loading, setLoading] = useState(false);
    const fileNameWithExt = `${fileName ?? documentTitle}.docx`;

    const handleDownload = async () => {
        setLoading(true);
        try {
            // Ahora pasamos documentTitle (no title) para coincidir con generateDocFromJSON
            const blob = await generateDocFromJSON({ documentTitle, body });
            saveAs(blob, fileNameWithExt);
        } catch (err) {
            console.error("Error al generar docx:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button className="btn" onClick={handleDownload} disabled={loading}>
            {loading ? "Preparando…" : "Descargar .docx"}
        </button>
    );
}
