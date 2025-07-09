// src/app/api/certifications/[code]/route.ts

import { NextResponse } from 'next/server';
import { getCertificationByCode } from '@/lib/repositories/certificationRepository';

/**
 * GET /api/certifications/[code]
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ code: string }> }
) {
    const { code } = await context.params;
    const cert = await getCertificationByCode(code);
    if (!cert) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    return NextResponse.json(cert, { status: 200 });
}

/**
 * HEAD /api/certifications/[code]
 */
export async function HEAD(
    request: Request,
    context: { params: Promise<{ code: string }> }
) {
    const { code } = await context.params;
    const cert = await getCertificationByCode(code);
    return new NextResponse(null, { status: cert ? 200 : 404 });
}
