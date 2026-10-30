"use client";

import Image from "next/image";
import Link from "next/link";
import { deleteProject, setFeatured, setPublished } from "@/app/admin/actions";
import { ConfirmButton, useAction } from "./confirm-dialog";
import { cx, ui } from "./ui";

export type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  featured: boolean;
  isDemo: boolean;
  category: string | null;
  coverId: string | null;
  coverExternal: boolean;
  imageCount: number;
  updatedAt: string;
};

function Badge({ children, tone }: { children: React.ReactNode; tone: "ok" | "muted" | "accent" }) {
  const tones = {
    ok: "bg-[#e5f1e8] text-a-ok",
    muted: "bg-a-bg text-a-muted",
    accent: "bg-a-accent-soft text-a-accent",
  };
  return <span className={cx("inline-flex rounded px-1.5 py-0.5 text-[12px] font-medium", tones[tone])}>{children}</span>;
}

export function ProjectsTable({ rows }: { rows: ProjectRow[] }) {
  const { run, pending } = useAction();

  if (rows.length === 0) {
    return (
      <div className="rounded-lg bg-a-panel px-5 py-10 text-center ring-1 ring-a-line">
        <p className="font-medium">Nenhum projeto ainda</p>
        <p className="mt-1 text-a-muted">Crie o primeiro projeto para ele aparecer no portfólio.</p>
        <Link href="/admin/projetos/novo" className={cx(ui.btn, ui.primary, "mt-4")}>
          Novo projeto
        </Link>
      </div>
    );
  }

  return (
    <ul className={cx(ui.panel, "divide-y divide-a-line")} aria-busy={pending}>
      {rows.map((row) => (
        <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:flex-nowrap sm:px-4">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-a-bg">
            {row.coverId ? (
              <Image src={`/media/${row.coverId}`} alt="" fill sizes="80px" unoptimized={row.coverExternal} className="object-cover" />
            ) : (
              <span className="grid h-full place-items-center text-[11px] text-a-muted">sem foto</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/admin/projetos/${row.id}`} className="block truncate font-medium hover:underline">
              {row.title}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-a-muted">
              <span>{row.category ?? "Sem categoria"}</span>
              <span aria-hidden>·</span>
              <span>
                {row.imageCount} {row.imageCount === 1 ? "imagem" : "imagens"}
              </span>
              {row.published ? <Badge tone="ok">Publicado</Badge> : <Badge tone="muted">Oculto</Badge>}
              {row.featured && <Badge tone="accent">Destaque</Badge>}
              {row.isDemo && <Badge tone="muted">Demonstração</Badge>}
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center gap-1 sm:w-auto">
            <Link href={`/admin/projetos/${row.id}`} className={cx(ui.btn, ui.secondary)}>
              Editar
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setFeatured(row.id, !row.featured))}
              className={cx(ui.btn, ui.ghost)}
              aria-pressed={row.featured}
            >
              {row.featured ? "Tirar destaque" : "Destacar"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setPublished(row.id, !row.published))}
              className={cx(ui.btn, ui.ghost)}
            >
              {row.published ? "Ocultar" : "Publicar"}
            </button>
            <ConfirmButton
              label="Excluir"
              title={`Excluir “${row.title}”?`}
              description="O projeto sai do site e do painel. As imagens continuam na biblioteca. Esta ação não pode ser desfeita."
              confirmLabel="Excluir projeto"
              action={() => deleteProject(row.id)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
