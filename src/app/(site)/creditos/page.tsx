import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { getPublishedCredits } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Créditos das imagens",
  robots: { index: false },
};

// Fotografias fixas do site (fora do painel).
const STATIC_CREDITS = [
  { where: "Sobre (copo-de-leite)", credit: "Foto: Marta Pawlik, Licença Unsplash", href: "https://unsplash.com/photos/yqmlajPxR3Y" },
  {
    where: "Processo (mesa com flores brancas)",
    credit: "Foto: Bhullargraphic, CC BY-SA 4.0, Wikimedia Commons",
    href: "https://commons.wikimedia.org/wiki/File:Legant_table_setting_with_white_floral_centerpiece.jpg",
  },
  {
    where: "Processo (montagem de arranjos)",
    credit: "Foto: Yelkrokoyade, CC BY-SA 3.0, Wikimedia Commons",
    href: "https://commons.wikimedia.org/wiki/File:Flower_table_decoration_Wedding_in_Budapest.jpg",
  },
  {
    where: "Processo (colunas com luzes)",
    credit: "Foto: domdomegg, CC BY 4.0, Wikimedia Commons",
    href: "https://commons.wikimedia.org/wiki/File:Warm_white_LED_lights_attached_to_pillars_for_a_wedding.JPG",
  },
];

export default async function CreditsPage() {
  const credits = await getPublishedCredits();
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="px-margin pt-[clamp(3rem,8vw,7rem)]">
        <h1 className="text-head">Créditos das imagens</h1>
        <p className="mt-6 max-w-[40rem] text-body text-muted">
          Algumas fotografias do site são de terceiros, usadas como ilustração sob licenças abertas. Os projetos marcados
          como demonstração não são trabalhos da Fest Decor.
        </p>
        <h2 className="mt-16 text-lead">Fotografias do site</h2>
        <ul className="mt-4 space-y-3 text-body">
          {STATIC_CREDITS.map((c) => (
            <li key={c.where}>
              {c.where}:{" "}
              <a href={c.href} className="link-quiet" target="_blank" rel="noopener">
                {c.credit}
              </a>
            </li>
          ))}
        </ul>
        {credits.length > 0 && (
          <>
            <h2 className="mt-16 text-lead">Imagens dos projetos</h2>
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
