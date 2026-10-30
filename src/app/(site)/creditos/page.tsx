import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { getPublishedCredits } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Créditos das imagens",
  robots: { index: false },
};

export default async function CreditsPage() {
  const credits = await getPublishedCredits();
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="px-margin pt-[clamp(3rem,8vw,7rem)]">
        <h1 className="text-head">Créditos das imagens</h1>
        <p className="mt-6 max-w-[40rem] text-body text-muted">
          As fotografias do site são de eventos decorados pela Fest Decor, publicadas no Instagram{" "}
          <a href="https://instagram.com/festdecorbhmg" className="link-quiet" target="_blank" rel="noopener">
            @festdecorbhmg
          </a>
          . Imagens de terceiros aparecem abaixo com o crédito do autor.
        </p>
        {credits.length > 0 && (
          <>
            <h2 className="mt-16 text-lead">Imagens de terceiros</h2>
            <ul className="mt-4 space-y-3 text-body">
              {credits.map((c, i) => (
                <li key={i}>
                  <Link href={`/portfolio/${c.slug}`} className="link-quiet">
                    {c.project}
                  </Link>
                  : {c.credit}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
