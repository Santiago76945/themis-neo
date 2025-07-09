// src/app/api/certifications/route.ts

import { NextResponse } from 'next/server';
import { saveCertification } from '@/lib/repositories/certificationRepository';

/**
 * POST /api/certifications
 * Guarda una nueva certificación en la base de datos.
 */
export async function POST(request: Request) {
    try {
        const { code, pdfUrl, hash, parties } = await request.json();

        // Validación de campos obligatorios
        if (!code || !pdfUrl || !hash || !parties) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // Guardar en la base de datos
        const savedCertification = await saveCertification({ code, pdfUrl, hash, parties });

        // Devolver el objeto guardado
        return NextResponse.json(savedCertification, { status: 200 });
    } catch (error: any) {
        console.error('Error al guardar certificación:', error);

        // Responder con mensaje de error
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
