// src/components/ConsoleEffectWrapper.tsx

"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Se carga dinámicamente el componente sin SSR
const ConsoleEffect = dynamic(() => import("./ConsoleEffect"), { ssr: false });

// Este wrapper se encarga de renderizar el efecto únicamente en la ruta de login
export default function ConsoleEffectWrapper() {
  const pathname = usePathname();

  // Si la ruta actual no es "/login", se retorna null
  if (pathname !== "/login") {
    return null;
  }

  return <ConsoleEffect />;
}
