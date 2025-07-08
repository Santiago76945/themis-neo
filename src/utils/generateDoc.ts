// src/utils/generateDoc.ts

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export interface DocOptions {
    title: string;
    body: string;
    outputFilename?: string;
}

/**
 * Genera un .docx basado en una plantilla usando Docxtemplater.
 * La plantilla debe estar en `public/template.docx` y usar <<title>> y <<body>>.
 */
export async function generateDocFromJSON(opts: DocOptions): Promise<Blob> {
    const { title, body } = opts;

    // 1) Cargar la plantilla desde public/
    const res = await fetch("/template.docx");
    if (!res.ok) {
        throw new Error("No se pudo cargar la plantilla template.docx");
    }
    const arrayBuffer = await res.arrayBuffer();

    // 2) Leer el ZIP (DOCX es un ZIP)
    const zip = new PizZip(arrayBuffer);

    // 3) Inicializar Docxtemplater con delimitadores personalizados
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "<<", end: ">>" },
    });

    // 4) Inyectar los datos
    doc.setData({ title, body });

    try {
        // 5) Renderizar la plantilla
        doc.render();
    } catch (err) {
        console.error("Error renderizando plantilla:", err);
        throw err;
    }

    // 6) Generar el documento final como Blob
    const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return blob;
}
