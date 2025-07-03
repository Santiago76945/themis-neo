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
import { getCoinsBalance, purchaseCoins } from "@/lib/apiClient";

interface AuthContextProps {
    user: FirebaseUser | null;
    uniqueCode: string | null;
    coinsBalance: number;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshCoins: () => Promise<void>;
    buyCoins: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    uniqueCode: null,
    coinsBalance: 0,
    signInWithGoogle: async () => { },
    signOut: async () => { },
    refreshCoins: async () => { },
    buyCoins: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [uniqueCode, setUniqueCode] = useState<string | null>(null);
    const [coinsBalance, setCoinsBalance] = useState<number>(0);

    // Obtener saldo de ThemiCoins
    const refreshCoins = async () => {
        if (!user) return;
        try {
            const { coins } = await getCoinsBalance();
            setCoinsBalance(coins);
        } catch (err) {
            console.error("Error cargando saldo de ThemiCoins:", err);
        }
    };

    // Comprar coins y actualizar saldo
    const buyCoins = async (amount: number) => {
        if (!user) throw new Error("No autorizado");
        try {
            const { coins } = await purchaseCoins(amount);
            setCoinsBalance(coins);
        } catch (err) {
            console.error("Error comprando ThemiCoins:", err);
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
                return;
            }
            setUser(fbUser);

            // 1) Perfil de usuario
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

            // 2) Cargar saldo de coins
            await refreshCoins();
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // El onAuthStateChanged manejará el resto
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
                signInWithGoogle,
                signOut,
                refreshCoins,
                buyCoins,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
