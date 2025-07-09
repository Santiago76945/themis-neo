// src/lib/apiClient.ts

import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Certification } from "@/lib/models/Certification";

// Helper para incluir el ID token de Firebase
async function fetchWithAuth(
    input: RequestInfo,
    init: RequestInit = {}
): Promise<any> {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) throw new Error("No autorizado");
    const token = await user.getIdToken();

    const res = await fetch(input.toString(), {
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

// — Transcripciones —
export const getTranscriptions = (): Promise<any> =>
    fetchWithAuth("/api/transcriptions");

export const postTranscription = (body: { title: string; fileUrl: string }): Promise<any> =>
    fetchWithAuth("/api/transcriptions", {
        method: "POST",
        body: JSON.stringify(body),
    });

export const deleteTranscription = (id: string): Promise<any> =>
    fetchWithAuth(`/api/transcriptions/${id}`, { method: "DELETE" });

// — ThemiCoins —
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

export const spendCoins = (amount: number): Promise<CoinsBalance> =>
    fetchWithAuth("/api/coins", {
        method: "PATCH",
        body: JSON.stringify({ amount }),
    });

// — Checkout Mercado Pago —
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

// — Modelos de documentos —
export interface DocumentModel {
    title: string;
    content: string;
    recommendation: string;
}

export const getDocumentModels = (): Promise<DocumentModel[]> =>
    fetch("/api/document-models").then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los modelos");
        return res.json();
    });

// — Documentos generados —
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

export const postDocument = (
    body: {
        title: string;
        modelTitle: string;
        model: string;
        info: string;
    }
): Promise<DocumentData> =>
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

// — Certificaciones de firma digital —
export const postCertification = (
    cert: Omit<Certification, 'createdAt'>
): Promise<Certification> =>
    fetchWithAuth("/api/certifications", {
        method: "POST",
        body: JSON.stringify(cert),
    });

export const getCertification = (
    code: string
): Promise<Certification> =>
    fetchWithAuth(`/api/certifications/${code}`);
