import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MediaImage } from "@/components/site/media-image";
import { SiteHeader } from "@/components/site/site-header";
import { formatMonth } from "@/lib/contact";
import { getProjectBySlug, getPublishedProjects, getPublishedSlugs } from "@/lib/data/public";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  // O build exige ao menos um valor; slugs desconhecidos são gerados sob demanda.
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Projeto não encontrado" };
  const cover = project.images[0];
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/portfolio/${project.slug}` },
    openGraph: {
      title: project.title,
      description: project.summary,
      images: cover ? [{ url: `/media/${cover.id}`, width: cover.width, height: cover.height, alt: cover.alt }] : undefined,
    },
  };
}

export default function ProjectPage(props: PageProps<"/portfolio/[slug]">) {
  return (
    <>
      <SiteHeader />
      <main id="conteudo">
        <Suspense fallback={<div className="min-h-svh" aria-busy="true" />}>
          <ProjectDetails params={props.params} />
        </Suspense>
      </main>
    </>
  );
}

async function ProjectDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const all = await getPublishedProjects();
  const index = all.findIndex((p) => p.id === project.id);
  const next = all.length > 1 ? all[(index + 1) % all.length] : null;
  const [cover, ...rest] = project.images;
  const credits = [...new Set(project.images.map((i) => i.credit).filter(Boolean))];
  const facts = [
    project.category && { label: "Evento", value: project.category.name },
    project.location && { label: "Local", value: project.location },
    project.eventDate && { label: "Data", value: formatMonth(project.eventDate) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article>
      <header className="grid gap-8 px-margin pt-[clamp(2rem,6vw,5rem)] pb-12 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-8">
          <h1 data-reveal className="text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.92] tracking-[-0.035em]">{project.title}</h1>
          <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-6 max-w-[38rem] text-lead">
            {project.summary}
          </p>
        </div>
        {facts.length > 0 && (
          <dl data-reveal style={{ "--i": 2 } as React.CSSProperties} className="grid grid-cols-3 gap-4 self-end text-small md:col-span-4 md:grid-cols-1 md:gap-3">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-muted">{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      {cover && (
        <figure className="relative">
          <MediaImage image={cover} preload sizes="100vw" className="max-h-[92svh] w-full object-cover" />
        </figure>
      )}

      <div className="grid gap-10 px-margin pt-16 md:grid-cols-12 md:gap-6 md:pt-24">
        <div data-reveal className="max-w-[40rem] space-y-5 text-body md:col-span-6 md:col-start-4">
          {project.description
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((para, i) => (
              <p key={i}>{para}</p>
            ))}
        </div>
      </div>

      {rest.length > 0 && (
        <ul className="grid gap-6 px-margin pt-16 md:grid-cols-2 md:pt-24">
          {rest.map((img, i) => (
            <li key={img.id} data-reveal className={rest.length % 2 === 1 && i === rest.length - 1 ? "md:col-span-2" : ""}>
              <MediaImage image={img} sizes="(min-width: 768px) 50vw, 100vw" className="w-full object-cover" />
            </li>
          ))}
        </ul>
      )}

      {(project.isDemo || credits.length > 0) && (
        <p className="max-w-[48rem] px-margin pt-8 text-small text-muted">
          {project.isDemo ? "Projeto de demonstração, com imagens ilustrativas. " : ""}
          {credits.join(", ")}
        </p>
      )}

      <div className="grid gap-10 px-margin pt-[clamp(6rem,12vw,10rem)] md:grid-cols-12 md:gap-6">
        <div data-reveal className="md:col-span-6">
          <h2 className="max-w-[14ch] text-head">Vamos desenhar a sua festa?</h2>
          <Link href="/#orcamento" className="btn-primary mt-8">
            Pedir orçamento
          </Link>
        </div>
        {next && (
          <Link href={`/portfolio/${next.slug}`} className="group self-end md:col-span-5 md:col-start-8">
            <span className="block text-lead leading-tight tracking-[-0.02em] transition-opacity group-hover:opacity-75">
              Próximo projeto: {next.title} →
            </span>
            <span className="mt-2 block text-small text-muted">{[next.category?.name, next.location].filter(Boolean).join(", ")}</span>
          </Link>
        )}
      </div>
    </article>
  );
}
