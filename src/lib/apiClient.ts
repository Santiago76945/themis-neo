// src/lib/apiClient.ts

import { getAuth, User } from "firebase/auth";
import { app } from "@/lib/firebase";

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

// **Nuevo** – Balance de coins
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
