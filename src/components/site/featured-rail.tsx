"use client";

import { useEffect, useRef } from "react";

/**
 * Trilho horizontal dos destaques. No computador, a seção fica presa na tela e a rolagem
 * vertical desliza os cartões para o lado; cada foto se move um pouco dentro do próprio cartão.
 * No celular, com "reduzir movimento" ou sem JavaScript, é um carrossel comum com arraste.
 */
export function FeaturedRail({ children, header }: { children: React.ReactNode; header: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = outer.current;
    const list = track.current;
    if (!el || !list) return;
    const pinned = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    let raf = 0;
    let distance = 0;

    function measure() {
      if (!el || !list) return;
      if (!pinned.matches) {
        el.style.height = "";
        list.style.transform = "";
        el.dataset.pinned = "false";
        return;
      }
      el.dataset.pinned = "true";
      distance = Math.max(list.scrollWidth - window.innerWidth, 0);
      el.style.height = `${window.innerHeight + distance}px`;
      update();
    }

    function update() {
      raf = 0;
      if (!el || !list || !pinned.matches) return;
      const top = el.getBoundingClientRect().top;
      const p = Math.min(Math.max(-top / Math.max(distance, 1), 0), 1);
      list.style.transform = `translate3d(${-p * distance}px,0,0)`;
      list.querySelectorAll<HTMLElement>("[data-parallax]").forEach((img) => {
        const r = img.parentElement!.getBoundingClientRect();
        const offset = (r.left + r.width / 2 - window.innerWidth / 2) / window.innerWidth;
        img.style.transform = `translate3d(${offset * -8}%,0,0)`;
      });
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    pinned.addEventListener("change", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      pinned.removeEventListener("change", measure);
    };
  }, []);

  return (
    <div ref={outer} className="group/rail relative">
      <div className="flex flex-col justify-center gap-10 py-6 group-data-[pinned=true]/rail:sticky group-data-[pinned=true]/rail:top-0 group-data-[pinned=true]/rail:h-svh group-data-[pinned=true]/rail:overflow-hidden group-data-[pinned=true]/rail:pt-24">
        {header}
        <ol
          ref={track}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-margin pb-4 [scrollbar-width:none] will-change-transform group-data-[pinned=true]/rail:w-max group-data-[pinned=true]/rail:snap-none group-data-[pinned=true]/rail:overflow-visible md:gap-8"
        >
          {children}
        </ol>
      </div>
    </div>
  );
}
