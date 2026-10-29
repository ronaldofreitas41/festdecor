import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { MobileMenu } from "./mobile-menu";

export const NAV = [
  { href: "/#destaques", label: "Destaques" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#contato", label: "Contato" },
];

/**
 * Barra simples: a logo, quatro links e o orçamento.
 * Na home ela fica sobre o campo terracota da abertura, sem a logo pequena (a logo grande é o título).
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={overlay ? "absolute inset-x-0 top-0 z-30 text-brand-text" : "relative z-30 bg-bg text-ink"}>
      <div className="flex items-center justify-between gap-6 px-margin py-4">
        <Link href="/" aria-label="Fest Decor, página inicial" className={overlay ? "sr-only focus:not-sr-only" : "text-brand"}>
          <BrandLogo id="logo-topo" title="Fest Decor" className="h-16 w-auto md:h-20" />
        </Link>
        <nav aria-label="Principal" className="ml-auto hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-small transition-opacity hover:opacity-70">
              {item.label}
            </Link>
          ))}
          {!overlay && (
            <Link href="/#orcamento" className="btn-primary">
              Pedir orçamento
            </Link>
          )}
        </nav>
        {!overlay && (
          <Link href="/#orcamento" className="btn-primary ml-auto min-h-11 px-4 md:hidden">
            Orçamento
          </Link>
        )}
        <MobileMenu items={NAV} className={overlay ? "ml-auto" : ""} />
      </div>
    </header>
  );
}
