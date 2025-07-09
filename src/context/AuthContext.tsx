// src/context/AuthContext.tsx

"use client";

import { ReactNode, useContext, createContext, useState, useEffect } from "react";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    User as FirebaseUser,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { getCoinsBalance, purchaseCoins, spendCoins as apiSpendCoins } from "@/lib/apiClient";

interface AuthContextProps {
    user: FirebaseUser | null;
    uniqueCode: string | null;
    coinsBalance: number;
    coinsPerToken: number;
    coinsPerMb: number;
    coinsPerMbStorage: number;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshCoins: () => Promise<void>;
    buyCoins: (amount: number) => Promise<void>;
    spendCoins: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    uniqueCode: null,
    coinsBalance: 0,
    coinsPerToken: 0,
    coinsPerMb: parseFloat(process.env.NEXT_PUBLIC_COINS_PER_MB || "0"),
    coinsPerMbStorage: parseFloat(process.env.NEXT_PUBLIC_COINS_PER_MB_STORAGE || "0"),
    signInWithGoogle: async () => {},
    signOut: async () => {},
    refreshCoins: async () => {},
    buyCoins: async () => {},
    spendCoins: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [uniqueCode, setUniqueCode] = useState<string | null>(null);
    const [coinsBalance, setCoinsBalance] = useState<number>(0);
    const [coinsPerToken, setCoinsPerToken] = useState<number>(0);

    // Tarifas por MB
    const coinsPerMb = parseFloat(process.env.NEXT_PUBLIC_COINS_PER_MB || "0");
    const coinsPerMbStorage = parseFloat(process.env.NEXT_PUBLIC_COINS_PER_MB_STORAGE || "0");

    // Obtener saldo y tarifa de tokens
    const refreshCoins = async () => {
        if (!user) return;
        try {
            const { coins, coinsPerToken: tokenRate } = await getCoinsBalance();
            setCoinsBalance(coins);
            setCoinsPerToken(tokenRate);
        } catch (err) {
            console.error("Error cargando saldo de ThemiCoins:", err);
        }
    };

    // Comprar coins y actualizar saldo
    const buyCoins = async (amount: number) => {
        if (!user) throw new Error("No autorizado");
        try {
            const { coins, coinsPerToken: tokenRate } = await purchaseCoins(amount);
            setCoinsBalance(coins);
            setCoinsPerToken(tokenRate);
        } catch (err) {
            console.error("Error comprando ThemiCoins:", err);
            throw err;
        }
    };

    // Gastar (descontar) coins y actualizar saldo
    const spendCoins = async (amount: number) => {
        if (!user) throw new Error("No autorizado");
        try {
            await apiSpendCoins(amount);
            await refreshCoins();
        } catch (err) {
            console.error("Error descontando ThemiCoins:", err);
            throw err;
        }
    };

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (!fbUser) {
                setUser(null);
                setUniqueCode(null);
                setCoinsBalance(0);
                setCoinsPerToken(0);
                return;
            }
            setUser(fbUser);

            // 1) Crear/leer perfil
            try {
                const token = await fbUser.getIdToken();
                const res = await fetch("/api/createUserProfile", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setUniqueCode(data.uniqueCode);
                } else {
                    console.error("createUserProfile error:", await res.text());
                }
            } catch (err) {
                console.error("Error en createUserProfile:", err);
            }

            // 2) Cargar saldo y tarifas
            await refreshCoins();
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const signOut = async () => {
        const auth = getAuth(app);
        await auth.signOut();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                uniqueCode,
                coinsBalance,
                coinsPerToken,
                coinsPerMb,
                coinsPerMbStorage,
                signInWithGoogle,
                signOut,
                refreshCoins,
                buyCoins,
                spendCoins,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
