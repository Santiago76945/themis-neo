// components/DocxDownloadButton.tsx

import React, { useState } from "react";
import { saveAs } from "file-saver";
import { generateDocFromJSON } from "@/utils/generateDoc";

interface DownloadButtonProps {
    title: string;
    body: string;
    outputFilename?: string;
}

export default function DocxDownloadButton({
    title,
    body,
    outputFilename,
}: DownloadButtonProps) {
    const [loading, setLoading] = useState(false);
    const filename = outputFilename || `${title}.docx`;

    const handleDownload = async () => {
        setLoading(true);
        try {
            const blob = await generateDocFromJSON({ title, body });
            saveAs(blob, filename);
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
