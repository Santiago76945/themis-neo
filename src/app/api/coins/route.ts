// src/app/api/coins/route.ts

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { verifyIdToken } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization') || '';
        const idToken = authHeader.replace('Bearer ', '');
        const { uid } = await verifyIdToken(idToken);

        await connectToDatabase();
        const user = await User.findOne({ uid });
        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            coins: user.coinsBalance,
            coinsPerToken: parseFloat(process.env.COINS_PER_TOKEN || '0'),
            coinsPerMbStorage: parseFloat(process.env.COINS_PER_MB_STORAGE || '0'),
        });
    } catch (err: any) {
        console.error('GET /api/coins error:', err);
        return NextResponse.json(
            { error: err.message || 'Error interno' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization') || '';
        const idToken = authHeader.replace('Bearer ', '');
        const { uid } = await verifyIdToken(idToken);

        const { amount } = await request.json();
        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json(
                { error: "El campo 'amount' debe ser un número mayor que cero" },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const user = await User.findOneAndUpdate(
            { uid },
            { $inc: { coinsBalance: amount } },
            { new: true }
        );
        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            coins: user.coinsBalance,
            coinsPerToken: parseFloat(process.env.COINS_PER_TOKEN || '0'),
            coinsPerMbStorage: parseFloat(process.env.COINS_PER_MB_STORAGE || '0'),
        });
    } catch (err: any) {
        console.error('POST /api/coins error:', err);
        return NextResponse.json(
            { error: err.message || 'Error interno' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const authHeader = request.headers.get('authorization') || '';
        const idToken = authHeader.replace('Bearer ', '');
        const { uid } = await verifyIdToken(idToken);

        const { amount } = await request.json();
        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json(
                { error: "El campo 'amount' debe ser un número mayor que cero" },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const updated = await User.findOneAndUpdate(
            { uid, coinsBalance: { $gte: amount } },
            { $inc: { coinsBalance: -amount } },
            { new: true }
        );
        if (!updated) {
            return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 402 });
        }

        return NextResponse.json({
            coins: updated.coinsBalance,
            coinsPerToken: parseFloat(process.env.COINS_PER_TOKEN || '0'),
            coinsPerMbStorage: parseFloat(process.env.COINS_PER_MB_STORAGE || '0'),
        });
    } catch (err: any) {
        console.error('PATCH /api/coins error:', err);
        return NextResponse.json(
            { error: err.message || 'Error interno' },
            { status: 500 }
        );
    }
}
