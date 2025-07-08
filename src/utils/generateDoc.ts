// src/utils/generateDoc.ts

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export interface DocOptions {
    /**
     * El título interno que irá al marcador <<title>> de la plantilla
     */
    documentTitle: string;
    /**
     * Cuerpo del documento para el marcador <<body>>
     */
    body: string;
}

export async function generateDocFromJSON(opts: DocOptions): Promise<Blob> {
    const { documentTitle, body } = opts;

    // 1) Cargar la plantilla desde public/template.docx
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
    //    Incluimos tanto 'title' como 'documentTitle' por si la plantilla usa uno u otro
    doc.setData({ title: documentTitle, documentTitle, body });

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
