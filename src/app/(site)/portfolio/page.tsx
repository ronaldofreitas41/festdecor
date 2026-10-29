import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioGrid } from "@/components/site/portfolio-grid";
import { SiteHeader } from "@/components/site/site-header";
import { getActiveCategories, getPublishedProjects } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Portfólio",
  description: "Casamentos, mini weddings, 15 anos e eventos decorados pela Fest Decor em Belo Horizonte e região.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const [projects, categories] = await Promise.all([getPublishedProjects(), getActiveCategories()]);
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="pt-[clamp(3rem,8vw,7rem)]">
        <div className="grid gap-6 px-margin pb-12 md:grid-cols-12">
          <h1 data-reveal className="text-[clamp(3.5rem,11vw,10rem)] leading-[0.9] tracking-[-0.04em] md:col-span-7">
            Portfólio
          </h1>
          <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="max-w-[30rem] self-end text-lead text-muted md:col-span-5">
            Festas que desenhamos e montamos, separadas por tipo de evento.
          </p>
        </div>
        {projects.length === 0 ? (
          <div className="px-margin">
            <p className="text-lead text-muted">Ainda não há projetos publicados.</p>
            <Link href="/#orcamento" className="btn-primary mt-8">
              Pedir orçamento
            </Link>
          </div>
        ) : (
          <PortfolioGrid projects={projects} categories={categories} />
        )}
        <div className="px-margin pt-[clamp(7rem,14vw,12rem)]">
          <h2 className="max-w-[16ch] text-head">Quer uma festa assim?</h2>
          <Link href="/#orcamento" className="btn-primary mt-8">
            Pedir orçamento
          </Link>
        </div>
      </main>
    </>
  );
}
