// src/app/api/document-models/route.ts

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const GET = async () => {
    try {
        // Directorio con los .json de modelos
        const modelsDir = path.join(process.cwd(), "src", "data", "documentModels");
        const files = await fs.readdir(modelsDir);

        const models = await Promise.all(
            files
                .filter((f) => f.endsWith(".json"))
                .map(async (fileName) => {
                    const filePath = path.join(modelsDir, fileName);
                    const raw = await fs.readFile(filePath, "utf-8");
                    const { title, content, recommendation } = JSON.parse(raw);
                    return { title, content, recommendation };
                })
        );

        return NextResponse.json(models);
    } catch (err: any) {
        console.error("GET /api/document-models error:", err);
        return NextResponse.json(
            { error: "No se pudieron cargar los modelos" },
            { status: 500 }
        );
    }
};
