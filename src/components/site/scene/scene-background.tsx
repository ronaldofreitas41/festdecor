"use client";

import { useEffect, useRef } from "react";

/**
 * Monta o fundo 3D depois que a página já está pronta, para não atrasar o primeiro conteúdo.
 * Sem WebGL ou com "reduzir movimento", nada muda: as seções mantêm as próprias cores.
 */
export function SceneBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let handle: { destroy: () => void } | null = null;
    let cancelled = false;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    idle(() => {
      import("./engine").then(({ startScene }) => {
        if (cancelled || !ref.current) return;
        handle = startScene(ref.current, { reducedMotion: false });
        // Só troca as cores das seções pelo fundo depois que o primeiro quadro foi desenhado.
        if (handle) requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && document.documentElement.classList.add("has-scene")));
      });
    });
    return () => {
      cancelled = true;
      handle?.destroy();
      document.documentElement.classList.remove("has-scene");
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
