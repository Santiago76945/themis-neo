// src/app/error.tsx

"use client"
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="es">
            <body style={{ padding: "4rem", textAlign: "center" }}>
                <h1>Algo salió mal</h1>
                <p>Estamos trabajando para solucionarlo.</p>
                <button onClick={() => reset()}>Reintentar</button>
            </body>
        </html>
    );
}
