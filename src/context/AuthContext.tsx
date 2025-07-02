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

interface AuthContextProps {
    user: FirebaseUser | null;
    uniqueCode: string | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    uniqueCode: null,
    signInWithGoogle: async () => { },
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [uniqueCode, setUniqueCode] = useState<string | null>(null);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setUniqueCode(null);
                return;
            }

            setUser(firebaseUser);
            const token = await firebaseUser.getIdToken();

            // Llamamos al Route Handler de Next.js en App Router
            const res = await fetch("/api/createUserProfile", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                console.error("createUserProfile error:", await res.text());
                setUniqueCode(null);
                return;
            }

            const data = await res.json();
            setUniqueCode(data.uniqueCode);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged gestionará user & uniqueCode
    };

    const signOut = async () => {
        const auth = getAuth(app);
        await auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, uniqueCode, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
