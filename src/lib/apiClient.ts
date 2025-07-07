// src/lib/apiClient.ts

import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

// Helper para incluir el ID token de Firebase
async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) throw new Error("No autorizado");
    const token = await user.getIdToken();

    const res = await fetch(input, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(init.headers || {}),
        },
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || res.statusText);
    return payload;
}

// ————————————————————————————————————————————————————————
// Transcripciones
export const getTranscriptions = () =>
    fetchWithAuth("/api/transcriptions");

export const postTranscription = (body: { title: string; fileUrl: string }) =>
    fetchWithAuth("/api/transcriptions", {
        method: "POST",
        body: JSON.stringify(body),
    });

export const deleteTranscription = (id: string) =>
    fetchWithAuth(`/api/transcriptions/${id}`, { method: "DELETE" });

// ————————————————————————————————————————————————————————
// Balance de ThemiCoins
export interface CoinsBalance {
    coins: number;
    coinsPerToken: number;
}

export const getCoinsBalance = (): Promise<CoinsBalance> =>
    fetchWithAuth("/api/coins");

export const purchaseCoins = (amount: number): Promise<CoinsBalance> =>
    fetchWithAuth("/api/coins", {
        method: "POST",
        body: JSON.stringify({ amount }),
    });

// ————————————————————————————————————————————————————————
// Checkout de Mercado Pago
export interface CheckoutPreference {
    init_point: string;
    id: string;
}

export const createCheckoutPreference = (
    bundleId: string
): Promise<CheckoutPreference> =>
    fetchWithAuth("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ bundleId }),
    });

// ————————————————————————————————————————————————————————
// Modelos de documentos
export interface DocumentModel {
    title: string;
    content: string;
    recommendation: string;
}

/**
 * Obtiene la lista de modelos JSON (title, content, recommendation)
 */
export const getDocumentModels = (): Promise<DocumentModel[]> =>
    // Nota: no usamos fetchWithAuth porque es pública
    fetch("/api/document-models").then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los modelos");
        return res.json();
    });

// ————————————————————————————————————————————————————————
// Documentos generados
export interface DocumentData {
    _id: string;
    userUid: string;
    title: string;
    modelTitle: string;
    model: string;
    info: string;
    content: string;
    tokens: number;
    totalTokens: number;
    coinsCost: number;
    createdAt: string;
    updatedAt: string;
}

export const getDocuments = (): Promise<DocumentData[]> =>
    fetchWithAuth("/api/documents");

export const getDocument = (id: string): Promise<DocumentData> =>
    fetchWithAuth(`/api/documents/${id}`);

export const postDocument = (body: {
    title: string;
    modelTitle: string;
    model: string;
    info: string;
}): Promise<DocumentData> =>
    fetchWithAuth("/api/documents", {
        method: "POST",
        body: JSON.stringify(body),
    });

export const deleteDocument = (
    id: string
): Promise<{ success: boolean }> =>
    fetchWithAuth(`/api/documents/${id}`, {
        method: "DELETE",
    });
