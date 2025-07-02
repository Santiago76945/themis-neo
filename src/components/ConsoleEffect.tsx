// src/components/ConsoleEffect.tsx

"use client";

import { useEffect, useRef } from "react";
import animatedTexts from "./animatedTexts.json";

// Declaraciones mínimas para jQuery
interface JQuery {
  typeIt: (options: { strings: string[]; speed: number; autoStart: boolean }) => void;
}
interface JQueryStatic {
  (selector: string): JQuery;
  fn: {
    typeIt: (options: { strings: string[]; speed: number; autoStart: boolean }) => void;
  };
}

export default function ConsoleEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Función para hacer scroll hasta el final del contenedor
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Se castea "window" para acceder a la propiedad "$"
    const $ = (window as unknown as { $?: JQueryStatic }).$;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    // MutationObserver para detectar cambios en el contenedor y hacer scroll
    const observer = new MutationObserver(() => {
      scrollToBottom();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    // Configurar TypeIt para cada línea de texto si la función está disponible
    if (typeof window !== "undefined" && $ && typeof $.fn.typeIt === "function") {
      animatedTexts.forEach((text, index) => {
        const delay = index * 4444;
        const timeoutId = setTimeout(() => {
          $(`#element-${index}`).typeIt({
            strings: [text],
            speed: 80,
            autoStart: true,
          });
        }, delay);
        timeoutIds.push(timeoutId);
      });
    }

    // Limpiar observer y timeouts al desmontar el componente
    return () => {
      observer.disconnect();
      timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  return (
    <div className="console-effect" ref={containerRef}>
      {animatedTexts.map((_, index) => (
        <p key={index} id={`element-${index}`}></p>
      ))}
      <style jsx>{`
        .console-effect {
          position: fixed;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          font-family: monospace;
          font-size: 25px;
          color: var(--accent);
          opacity: 0.2;
          white-space: pre-wrap;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
