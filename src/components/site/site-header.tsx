import Link from "next/link";
import { MobileMenu } from "./mobile-menu";

export const NAV = [
  { href: "/#destaques", label: "Destaques" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#contato", label: "Contato" },
];

/**
 * Barra simples: nome, quatro links e o orçamento.
 * Na home ela fica sobre a fotografia, sem o nome (o nome é o próprio título da página).
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-30 bg-[linear-gradient(rgb(0_0_0/0.55),transparent)]"
          : "relative z-30 bg-bg"
      }
    >
      <div className="flex items-center justify-between gap-6 px-margin py-5">
        <Link
          href="/"
          className={`text-[1.375rem] font-medium tracking-[-0.02em] ${overlay ? "sr-only focus:not-sr-only" : ""}`}
        >
          Fest Decor
        </Link>
        <nav aria-label="Principal" className="ml-auto hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-small text-ink transition-opacity hover:opacity-70">
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
        <MobileMenu items={NAV} />
      </div>
    </header>
  );
}
