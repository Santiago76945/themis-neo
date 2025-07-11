// src/app/error.tsx

"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div style={{ padding: "4rem", textAlign: "center" }}>
            <h1>Algo salió mal</h1>
            <p>Estamos trabajando para solucionarlo.</p>
            <button className="btn" onClick={() => reset()}>
                Reintentar
            </button>
        </div>
    );
}