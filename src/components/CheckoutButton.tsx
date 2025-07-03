// src/components/CheckoutButton.tsx

"use client";

import React, { useState } from "react";
import { createCheckoutPreference } from "@/lib/apiClient";

interface CheckoutButtonProps {
    bundleId: string;
    label: string;
}

export default function CheckoutButton({ bundleId, label }: CheckoutButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            // Enviamos solo el bundleId al backend
            const { init_point } = await createCheckoutPreference(bundleId);
            // Redirigimos al checkout de Mercado Pago
            window.location.href = init_point;
        } catch (err: any) {
            console.error("Error iniciando checkout:", err);
            alert("No se pudo iniciar la compra. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className="btn btn-primary"
            onClick={handleCheckout}
            disabled={loading}
        >
            {loading ? "Cargando..." : label}
        </button>
    );
}

