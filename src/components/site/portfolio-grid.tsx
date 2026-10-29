"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { PublicProject } from "@/lib/data/public";
import { MediaImage } from "./media-image";

const FILTER_EVENT = "festdecor:filtro";
const readFilter = () => new URLSearchParams(window.location.search).get("categoria") ?? "";
function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(FILTER_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(FILTER_EVENT, callback);
  };
}

// Larguras alternadas no grid de 12 colunas: as fotos ficam como gravuras numa parede, não como cartões.
const SPANS = ["md:col-span-7", "md:col-span-5 md:mt-40", "md:col-span-5 md:col-start-2", "md:col-span-6 md:mt-24"];
const RATIOS = ["aspect-[4/3]", "aspect-[4/5]", "aspect-[4/5]", "aspect-[16/10]"];

export function PortfolioGrid({
  projects,
  categories,
}: {
  projects: PublicProject[];
  categories: { name: string; slug: string }[];
}) {
  // O filtro vive no endereço (?categoria=), então links compartilhados abrem já filtrados.
  const fromUrl = useSyncExternalStore(subscribe, readFilter, () => "");
  const active = categories.some((c) => c.slug === fromUrl) ? fromUrl : "";

  function choose(slug: string) {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("categoria", slug);
    else url.searchParams.delete("categoria");
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event(FILTER_EVENT));
  }

  const visible = active ? projects.filter((p) => p.category?.slug === active) : projects;

  return (
    <>
      {categories.length > 1 && (
        <div role="group" aria-label="Filtrar por categoria" className="flex flex-wrap gap-2 px-margin">
          {[{ name: "Todos", slug: "" }, ...categories].map((c) => (
            <button
              key={c.slug || "todos"}
              type="button"
              aria-pressed={active === c.slug}
              onClick={() => choose(c.slug)}
              className="min-h-11 rounded-full bg-surface-2 px-4 text-small text-ink transition-colors hover:bg-[#33291f] active:scale-[0.97] aria-pressed:bg-ink aria-pressed:text-bg"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {visible.length} {visible.length === 1 ? "projeto" : "projetos"}
      </p>

      {visible.length === 0 ? (
        <p className="px-margin pt-16 text-lead text-muted">Nenhum projeto nesta categoria ainda.</p>
      ) : (
        <ul className="mt-16 grid grid-cols-1 gap-x-6 gap-y-20 px-margin md:grid-cols-12 md:gap-y-28">
          {visible.map((project, i) => {
            const cover = project.images[0];
            return (
              <li key={project.id} data-reveal className={SPANS[i % SPANS.length]}>
                <article className="group relative">
                  <div className={`relative overflow-hidden bg-surface ${RATIOS[i % RATIOS.length]}`}>
                    {cover ? (
                      <MediaImage
                        image={cover}
                        fill
                        sizes="(min-width: 768px) 55vw, 100vw"
                        loading={i < 4 ? "eager" : "lazy"}
                        className="object-cover brightness-[0.86] transition-[scale,filter] duration-700 ease-[var(--ease-out)] group-hover:scale-[1.03] group-hover:brightness-95"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-small text-muted">Sem imagem</span>
                    )}
                  </div>
                  <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h2 className="text-[1.625rem] leading-tight tracking-[-0.02em]">
                      <Link href={`/portfolio/${project.slug}`} className="after:absolute after:inset-0">
                        {project.title}
                      </Link>
                    </h2>
                    <p className="text-small text-muted">
                      {[project.category?.name, project.location].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <p className="mt-3 max-w-[44ch] text-body">{project.summary}</p>
                  {project.isDemo && <p className="mt-2 text-small text-muted">Projeto de demonstração</p>}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
