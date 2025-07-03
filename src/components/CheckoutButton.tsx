// src/components/CheckoutButton.tsx

"use client";

import { useState } from "react";
import { createCheckoutPreference } from "@/lib/apiClient";

interface CheckoutButtonProps {
    /** 
     * Items to send to Mercado Pago.
     * Each item must have:
     *  - title: string
     *  - quantity: number
     *  - unit_price: number
     */
    items: { title: string; quantity: number; unit_price: number }[];
    className?: string;
}

export default function CheckoutButton({ items, className }: CheckoutButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        setError(null);
        setLoading(true);
        try {
            // Llama a tu API para crear la preferencia
            const { init_point } = await createCheckoutPreference(items);
            // Redirige al checkout de Mercado Pago
            window.location.href = init_point;
        } catch (err: any) {
            console.error("Error iniciando checkout:", err);
            setError(err.message || "No se pudo iniciar el pago");
            setLoading(false);
        }
    };

    return (
        <div className={className}>
            <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn"
            >
                {loading ? "Redirigiendo…" : "Pagar con Mercado Pago"}
            </button>
            {error && (
                <p style={{ color: "var(--color-destructive)", marginTop: "0.5rem" }}>
                    {error}
                </p>
            )}
        </div>
    );
}
