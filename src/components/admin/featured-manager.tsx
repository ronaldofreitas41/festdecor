"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { reorderFeatured, setFeatured } from "@/app/admin/actions";
import { useAction } from "./confirm-dialog";
import { cx, ui } from "./ui";

export type FeaturedItem = { id: string; title: string; slug: string; category: string | null; coverId: string | null;
  coverExternal: boolean;
  published: boolean;
};

/** Ordem dos destaques: o primeiro também é a foto de abertura do site. */
export function FeaturedManager({ items }: { items: FeaturedItem[] }) {
  const [order, setOrder] = useState(items);
  const { run, pending } = useAction();

  // Quando o servidor devolve uma lista nova (após salvar ou mudar destaques), ela vence.
  const [serverItems, setServerItems] = useState(items);
  if (items !== serverItems) {
    setServerItems(items);
    setOrder(items);
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    const previous = order;
    setOrder(next);
    run(
      () => reorderFeatured(next.map((i) => i.id)),
      (r) => {
        if (!r.ok) setOrder(previous);
      },
    );
  }

  if (order.length === 0) {
    return (
      <p className="rounded-lg bg-a-panel px-5 py-8 text-center text-a-muted ring-1 ring-a-line">
        Nenhum projeto em destaque. Use “Destacar” na lista abaixo para escolher os que aparecem na página inicial.
      </p>
    );
  }

  return (
    <ol className={cx(ui.panel, "divide-y divide-a-line")} aria-busy={pending}>
      {order.map((item, i) => (
        <li key={item.id} className="flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
          <span className="w-6 text-right text-sm text-a-muted tabular-nums max-sm:hidden" aria-hidden>
            {i + 1}
          </span>
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-a-bg">
            {item.coverId && <Image src={`/media/${item.coverId}`} alt="" fill sizes="64px" unoptimized={item.coverExternal} className="object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/admin/projetos/${item.id}`} className="line-clamp-2 font-medium hover:underline sm:block sm:truncate">
              {item.title}
            </Link>
            <p className="truncate text-[13px] text-a-muted">
              {i === 0 ? "Abre a página inicial" : item.category ?? "Sem categoria"}
              {!item.published && " · oculto do site"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0 || pending}
              aria-label={`Subir ${item.title}`}
              className={cx(ui.btn, ui.secondary, "w-10 px-0")}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === order.length - 1 || pending}
              aria-label={`Descer ${item.title}`}
              className={cx(ui.btn, ui.secondary, "w-10 px-0")}
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => run(() => setFeatured(item.id, false))}
              disabled={pending}
              className={cx(ui.btn, ui.ghost, "max-sm:hidden")}
            >
              Remover
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
