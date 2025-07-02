// src/app/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Si está logueado, vamos al menú principal
                router.replace("/menu");
            } else {
                // Si no, lo enviamos al login
                router.replace("/login");
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Mientras Next decide a dónde ir, no renderizamos nada
    return null;
}
