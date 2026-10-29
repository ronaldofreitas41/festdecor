import Link from "next/link";
import { cacheLife } from "next/cache";

/** Um fecho discreto: o que é, poucos links e o ano. */
export async function SiteFooter() {
  "use cache";
  cacheLife("days");
  const year = new Date().getFullYear();
  return (
    <footer className="px-margin pt-[20svh] pb-6 md:pt-[30svh]">
      <div className="flex flex-col gap-2 text-small text-muted lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-baseline lg:gap-6">
        <p>Fest Decor, decoração de eventos em Belo Horizonte</p>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-1 text-ink">
          <Link href="/portfolio" className="link-quiet">
            Portfólio
          </Link>
          <Link href="/#orcamento" className="link-quiet">
            Orçamento
          </Link>
          <Link href="/creditos" className="link-quiet">
            Créditos das imagens
          </Link>
          <Link href="/admin" className="link-quiet" prefetch={false}>
            Acesso da equipe
          </Link>
        </nav>
        <p className="lg:text-right">© {year} Fest Decor</p>
      </div>
    </footer>
  );
}
