import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="px-margin pt-[clamp(4rem,10vw,9rem)]">
        <h1 className="max-w-[14ch] text-head">Esta página não existe mais</h1>
        <p className="mt-6 max-w-[34rem] text-lead text-muted">O projeto pode ter sido renomeado ou retirado do site.</p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link href="/portfolio" className="btn-primary">
            Ver o portfólio
          </Link>
          <Link href="/" className="link-quiet text-small">
            Voltar ao início
          </Link>
        </div>
      </main>
    </>
  );
}
