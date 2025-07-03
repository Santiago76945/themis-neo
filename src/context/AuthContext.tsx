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
import { getCoinsBalance } from "@/lib/apiClient";

interface AuthContextProps {
    user: FirebaseUser | null;
    uniqueCode: string | null;
    coinsBalance: number;
    coinsPerToken: number;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshCoins: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    uniqueCode: null,
    coinsBalance: 0,
    coinsPerToken: 0,
    signInWithGoogle: async () => { },
    signOut: async () => { },
    refreshCoins: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [uniqueCode, setUniqueCode] = useState<string | null>(null);
    const [coinsBalance, setCoinsBalance] = useState<number>(0);
    const [coinsPerToken, setCoinsPerToken] = useState<number>(0);

    // Recarga el balance de coins desde la API
    const refreshCoins = async () => {
        if (!user) return;
        try {
            const { coins, coinsPerToken } = await getCoinsBalance();
            setCoinsBalance(coins);
            setCoinsPerToken(coinsPerToken);
        } catch (e) {
            console.error("Error cargando coinsBalance:", e);
        }
    };

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setUniqueCode(null);
                setCoinsBalance(0);
                setCoinsPerToken(0);
                return;
            }

            setUser(firebaseUser);
            const token = await firebaseUser.getIdToken();

            // 1) Crear ó recuperar perfil de usuario
            try {
                const res = await fetch("/api/createUserProfile", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    console.error("createUserProfile error:", await res.text());
                    setUniqueCode(null);
                } else {
                    const data = await res.json();
                    setUniqueCode(data.uniqueCode);
                }
            } catch (err) {
                console.error("Error en createUserProfile:", err);
                setUniqueCode(null);
            }

            // 2) Cargar saldo de ThemiCoins y tarifa por token
            await refreshCoins();
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged se encargará de inicializar el perfil y balance
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
                signInWithGoogle,
                signOut,
                refreshCoins,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
