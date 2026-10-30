"use client";

import { useEffect } from "react";

/**
 * Rolagem com inércia suave (Lenis) no computador. A rolagem continua nativa por baixo,
 * então o fundo 3D, o trilho dos destaques e as animações de CSS seguem funcionando.
 * Fica desligada no toque e com "reduzir movimento".
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ autoRaf: true, lerp: 0.085, anchors: true });
      destroy = () => lenis.destroy();
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);
  return null;
}
