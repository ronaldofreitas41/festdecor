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
 * Uma pílula flutuante, fixa no topo: a logo, quatro links e o orçamento.
 * Fora da home, um espaço do mesmo tamanho empurra o conteúdo para baixo dela.
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <>
      <header className="fixed inset-x-0 top-3 z-40 flex justify-center px-3 md:top-4">
        <div className="flex w-full max-w-[56rem] items-center gap-3 rounded-full bg-bg/85 py-1.5 pr-1.5 pl-5 text-ink shadow-[0_10px_40px_-12px_rgb(58_30_19/0.35)] backdrop-blur-md">
          <Link href="/" aria-label="Fest Decor, página inicial" className="shrink-0 text-brand">
            <BrandLogo id="logo-topo" title="Fest Decor" className="h-11 w-auto" />
          </Link>
          <nav aria-label="Principal" className="mx-auto hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-small transition-opacity hover:opacity-65">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/#orcamento" className="btn-primary ml-auto min-h-11 px-4 md:ml-0 md:px-5">
            <span className="md:hidden">Orçamento</span>
            <span className="max-md:hidden">Pedir orçamento</span>
          </Link>
          <MobileMenu items={NAV} className="pr-2" />
        </div>
      </header>
      {!overlay && <div aria-hidden="true" className="h-24 md:h-28" />}
    </>
  );
}
