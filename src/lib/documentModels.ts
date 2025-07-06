// src/lib/documentModels.ts

import { promises as fs } from "fs";
import path from "path";

export interface DocumentModelDef {
    title: string;
    content: string;
}

export async function getAllDocumentModels(): Promise<DocumentModelDef[]> {
    const dir = path.join(process.cwd(), "src/data/documentModels");
    const files = await fs.readdir(dir);

    // Filtramos sólo JSON
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    // Leemos y parseamos cada archivo
    const models: DocumentModelDef[] = [];
    for (const file of jsonFiles) {
        const filePath = path.join(dir, file);
        const raw = await fs.readFile(filePath, "utf-8");
        const json = JSON.parse(raw) as DocumentModelDef;
        models.push(json);
    }

    return models;
}
