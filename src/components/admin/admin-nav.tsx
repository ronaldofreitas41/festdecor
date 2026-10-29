"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

const ITEMS = [
  { href: "/admin", label: "Projetos", match: (p: string) => p === "/admin" || p.startsWith("/admin/projetos") },
  { href: "/admin/imagens", label: "Imagens", match: (p: string) => p.startsWith("/admin/imagens") },
  { href: "/admin/categorias", label: "Categorias", match: (p: string) => p.startsWith("/admin/categorias") },
  { href: "/admin/configuracoes", label: "Contato e WhatsApp", match: (p: string) => p.startsWith("/admin/configuracoes") },
];

/** Navegação com o item atual marcado (lê o endereço, por isso fica dentro de Suspense). */
export function ActiveAdminNav() {
  return <AdminNav pathname={usePathname()} />;
}

export function AdminNav({ pathname = "" }: { pathname?: string }) {
  return (
    <nav aria-label="Painel" className="-mx-1 flex gap-1 overflow-x-auto lg:mx-0 lg:mt-6 lg:flex-col">
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex min-h-9 shrink-0 items-center rounded-md px-3 text-sm whitespace-nowrap transition-colors",
              active ? "bg-a-bg font-medium text-a-ink" : "text-a-muted hover:bg-a-bg hover:text-a-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
