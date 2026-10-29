import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/site/brand-logo";
import { FeaturedRail } from "@/components/site/featured-rail";
import { MediaImage } from "@/components/site/media-image";
import { QuoteComposer } from "@/components/site/quote-composer";
import { SiteHeader } from "@/components/site/site-header";
import { formatPhone, instagramLink, whatsappLink } from "@/lib/contact";
import { getEventTypes, getFeaturedProjects, getSiteSettings, type PublicProject } from "@/lib/data/public";
import { SITE } from "@/lib/site";

import fotoCopoDeLeite from "../../../public/img/copo-de-leite.jpg";
import fotoProjeto from "../../../public/img/processo-projeto.jpg";
import fotoMontagem from "../../../public/img/processo-montagem.jpg";
import fotoEvento from "../../../public/img/processo-evento.jpg";

export default async function HomePage() {
  const [featured, settings, eventTypes] = await Promise.all([getFeaturedProjects(), getSiteSettings(), getEventTypes()]);
  const lead = featured[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    areaServed: "Belo Horizonte e região",
    address: { "@type": "PostalAddress", addressLocality: "Belo Horizonte", addressRegion: "MG", addressCountry: "BR" },
    sameAs: [instagramLink(settings.instagram)].filter(Boolean),
    ...(settings.whatsapp ? { telephone: `+${settings.whatsapp}` } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero lead={lead} />
      <main id="conteudo">
        <Featured projects={featured} />
        <About />
        <Process />
        <section id="orcamento" data-bg="cream" data-scene="3" aria-labelledby="orcamento-titulo" className="scroll-mt-6 bg-bg px-margin pt-[clamp(7rem,14vw,13rem)]">
          <div className="max-w-[38rem]">
            <h2 id="orcamento-titulo" data-reveal className="text-head">
              Peça seu orçamento
            </h2>
            <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-6 text-lead text-muted">
              Escolha o tipo de festa, o mês e o tamanho. A mensagem fica pronta para você enviar.
            </p>
          </div>
          <div data-reveal style={{ "--i": 2 } as React.CSSProperties} className="mt-14">
            <QuoteComposer eventTypes={eventTypes} contact={settings} />
          </div>
        </section>
        <Contact settings={settings} />
      </main>
    </>
  );
}

/**
 * A abertura é a própria logo sobre o campo terracota. Atrás dela, o fundo 3D faz chover pétalas;
 * a foto do primeiro destaque fica num arco, como o "decor de eventos" da logo.
 */
function Hero({ lead }: { lead?: PublicProject }) {
  const cover = lead?.images[0];
  return (
    <div data-bg="brand" data-scene="0" className="relative overflow-hidden bg-brand text-brand-text lg:h-svh lg:min-h-[680px]">
      <SiteHeader overlay />
      <div className="relative grid gap-12 px-margin pt-28 pb-14 lg:h-full lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center lg:gap-[6vw] lg:pt-24 lg:pb-12">
        <div className="flex flex-col items-start gap-8 lg:gap-[5vh]">
          <h1 className="wordmark-scale w-full text-brand-ink">
            <BrandLogo id="logo-abertura" className="h-auto w-[min(100%,34rem)] md:w-[min(70vw,40rem)] lg:w-[min(100%,58vh)]" />
          </h1>
          <div className="flex flex-col items-start gap-6">
            <p data-reveal className="max-w-[28rem] text-lead leading-snug">
              Decoração, cenografia e flores para casamentos, 15 anos e eventos em Belo Horizonte.
            </p>
            <Link href="#orcamento" data-reveal style={{ "--i": 1 } as React.CSSProperties} className="btn-primary on-brand">
              Pedir orçamento
            </Link>
          </div>
        </div>
        <figure className="w-full max-w-[34rem] justify-self-center lg:max-w-none lg:justify-self-end">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-[2rem] bg-brand-leaf shadow-[0_40px_80px_-30px_rgb(40_15_5/0.55)] lg:aspect-auto lg:h-[min(74vh,46rem)]">
            {cover ? (
              <MediaImage image={cover} fill preload sizes="(min-width: 1024px) 40vw, 100vw" className="drift object-cover" />
            ) : (
              <Image src={fotoCopoDeLeite} alt="" fill preload sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            )}
          </div>
          {lead && (
            <figcaption className="mt-3 text-small">
              <Link href={`/portfolio/${lead.slug}`} className="link-quiet">
                {lead.title}
              </Link>
              {lead.isDemo ? ", projeto de demonstração" : ""}
            </figcaption>
          )}
        </figure>
      </div>
    </div>
  );
}

function yearOf(date: string | null) {
  return date ? date.slice(0, 4) : "";
}

/** Os destaques passam de lado, como convidados chegando; atrás deles, as pétalas viram guirlanda. */
function Featured({ projects }: { projects: PublicProject[] }) {
  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4 px-margin">
      <h2 id="destaques-titulo" data-reveal className="text-head">
        Projetos em destaque
      </h2>
      <Link href="/portfolio" data-reveal className="link-quiet text-small">
        Ver o portfólio completo
      </Link>
    </div>
  );
  return (
    <section id="destaques" data-bg="cream" data-scene="1" aria-labelledby="destaques-titulo" className="scroll-mt-0 bg-bg pt-[clamp(5rem,10vw,9rem)]">
      {projects.length === 0 ? (
        <>
          {header}
          <p className="mt-10 px-margin text-lead text-muted">Os próximos projetos aparecem aqui em breve.</p>
        </>
      ) : (
        <FeaturedRail header={header}>
          {projects.map((project, index) => {
            const cover = project.images[0];
            return (
              <li key={project.id} className="w-[80vw] shrink-0 snap-start sm:w-[58vw] lg:w-[min(36vw,34rem)]">
                <article aria-labelledby={`destaque-${project.id}`} className="group relative">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-surface lg:aspect-auto lg:h-[min(58vh,40rem)]">
                    <div data-parallax className="absolute inset-0 scale-[1.18] transition-transform duration-700 ease-out">
                      <MediaImage
                        image={cover}
                        fill
                        sizes="(min-width: 1024px) 36vw, 80vw"
                        loading={index < 2 ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <span className="absolute top-4 left-4 rounded-full bg-bg/85 px-3 py-1 text-small backdrop-blur-sm">
                      {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h3 id={`destaque-${project.id}`} className="text-lead leading-tight font-medium tracking-[-0.02em]">
                      <Link href={`/portfolio/${project.slug}`} className="after:absolute after:inset-0">
                        {project.title}
                      </Link>
                    </h3>
                    <p className="shrink-0 text-small text-muted">
                      {[project.category?.name, yearOf(project.eventDate)].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <p className="mt-1 max-w-[34rem] text-small text-muted">
                    {project.summary}
                    {project.isDemo ? " Projeto de demonstração." : ""}
                  </p>
                </article>
              </li>
            );
          })}
        </FeaturedRail>
      )}
    </section>
  );
}

const STATEMENT = "Criamos eventos que não existiam antes.".split(" ");

/** A frase da marca acende palavra por palavra enquanto passa pela tela. */
function About() {
  return (
    <section id="sobre" data-bg="cream" data-scene="1" aria-labelledby="sobre-titulo" className="scroll-mt-6 bg-bg px-margin pt-[clamp(8rem,16vw,14rem)]">
      <h2 id="sobre-titulo" className="scroll-words max-w-[16ch] text-[clamp(2.75rem,7.4vw,7.5rem)] leading-[0.96] tracking-[-0.035em]">
        {STATEMENT.map((word, i) => (
          <span key={i} style={{ "--w": i } as React.CSSProperties}>
            {word}{" "}
          </span>
        ))}
      </h2>
      <div className="mt-[clamp(4rem,8vw,7rem)] grid gap-12 md:grid-cols-12 md:items-end">
        <div
          data-reveal
          className="relative mx-auto aspect-[3/4] w-[86%] max-w-[30rem] overflow-hidden rounded-t-full rounded-b-[2rem] md:col-span-5 md:mx-0 md:w-full"
        >
          <Image src={fotoCopoDeLeite} alt="Um copo-de-leite branco sobre fundo escuro" fill sizes="(min-width: 768px) 40vw, 86vw" className="object-cover" />
        </div>
        <div className="flex flex-col gap-12 md:col-span-6 md:col-start-7 md:pb-6">
          <div data-reveal style={{ "--i": 1 } as React.CSSProperties}>
            <h3 className="text-lead tracking-[-0.015em]">Projeto autoral</h3>
            <p className="mt-3 text-body">
              Cada festa começa do zero: uma conversa sobre quem vocês são, o lugar escolhido e a luz do horário. Daí sai um
              projeto desenhado para aquele dia, sem pacote pronto.
            </p>
          </div>
          <div data-reveal style={{ "--i": 2 } as React.CSSProperties}>
            <h3 className="text-lead tracking-[-0.015em]">Design, cenografia e flores</h3>
            <p className="mt-3 text-body">
              Cuidamos do conjunto: mobiliário, tecidos, iluminação e arranjos montados no local pela nossa equipe. Atendemos
              BH e região e levamos projetos para outras cidades do Brasil.
            </p>
          </div>
          <Link href="#orcamento" data-reveal style={{ "--i": 3 } as React.CSSProperties} className="btn-primary self-start">
            Pedir orçamento
          </Link>
        </div>
      </div>
    </section>
  );
}

const STAGES = [
  {
    image: fotoProjeto,
    alt: "Mesa posta com caminho de flores brancas",
    lead: "Na primeira conversa,",
    text: "entendemos a data, o local, o número de convidados e o clima que vocês imaginam. Depois vem o projeto: paleta, flores da estação, mobiliário e luz, com orçamento detalhado.",
  },
  {
    image: fotoMontagem,
    alt: "Floristas montando arranjos altos de hortênsias",
    lead: "No dia do evento,",
    text: "nossa equipe monta flores, tecidos e iluminação no próprio espaço, horas antes da chegada dos convidados, e cuida da desmontagem ao final.",
  },
  {
    image: fotoEvento,
    alt: "Colunas envoltas em cortinas de luzes quentes",
    lead: "Quando as portas abrem,",
    text: "tudo já está aceso. Vocês só chegam e vivem a festa.",
  },
];

function Stage({ index, className }: { index: number; className?: string }) {
  const s = STAGES[index];
  return (
    <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className={`max-w-[36ch] text-body ${className ?? ""}`}>
      <strong className="font-semibold">{s.lead}</strong> {s.text}
    </p>
  );
}

/** Três fotografias descendo em diagonal; o texto de cada etapa ocupa o vão que a escada deixa. */
function Process() {
  return (
    <section data-bg="brand" data-scene="2" aria-labelledby="processo-titulo" className="mt-[clamp(6rem,12vw,10rem)] bg-brand px-margin pt-[clamp(7rem,14vw,12rem)] pb-[clamp(7rem,14vw,12rem)] text-brand-text">
      <div className="grid gap-6 md:grid-cols-12">
        <figure data-reveal className="max-md:order-2 md:col-span-5 lg:col-span-4">
          <Image src={STAGES[0].image} alt={STAGES[0].alt} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[3/4] w-full rounded-[2rem] object-cover" />
        </figure>
        <div className="max-md:contents md:col-span-6 md:col-start-7 md:flex md:flex-col md:gap-10">
          <h2 id="processo-titulo" data-reveal className="text-head max-md:order-1 max-md:mb-4">
            Do primeiro encontro à festa
          </h2>
          <Stage index={0} className="max-md:order-3 max-md:mt-6" />
        </div>
      </div>

      <div className="mt-14 grid gap-6 md:mt-24 md:grid-cols-12 lg:-mt-[16vw]">
        <figure data-reveal className="ml-auto w-[62%] md:col-span-4 md:col-start-5 md:ml-0 md:w-auto lg:col-span-3 lg:col-start-6">
          <Image src={STAGES[1].image} alt={STAGES[1].alt} sizes="(min-width: 768px) 25vw, 62vw" className="aspect-square w-full rounded-[2rem] object-cover" />
        </figure>
        <Stage index={1} className="ml-auto w-[62%] md:col-span-4 md:col-start-9 md:ml-0 md:w-auto" />
      </div>

      <div className="mt-14 grid gap-6 md:mt-[120px] md:grid-cols-12">
        <Stage index={2} className="w-[78%] md:order-1 md:col-span-4 md:col-start-3 md:w-auto md:justify-self-end" />
        <figure data-reveal className="w-[78%] md:order-2 md:col-span-6 md:col-start-7 md:w-auto lg:col-span-5 lg:col-start-8">
          <Image src={STAGES[2].image} alt={STAGES[2].alt} sizes="(min-width: 768px) 42vw, 78vw" className="aspect-[16/10] w-full rounded-[2rem] object-cover" />
        </figure>
      </div>
    </section>
  );
}

function Contact({ settings }: { settings: Awaited<ReturnType<typeof getSiteSettings>> }) {
  const ig = instagramLink(settings.instagram);
  const wa = whatsappLink(settings.whatsapp, "Olá, Fest Decor! Quero conversar sobre um evento.");
  const phone = formatPhone(settings);
  const display = settings.email || (settings.instagram ? `@${settings.instagram}` : "");
  const displayHref = settings.email ? `mailto:${settings.email}` : ig;

  return (
    <section
      id="contato"
      data-bg="brand"
      data-scene="3"
      aria-labelledby="contato-titulo"
      className="relative mt-[clamp(7rem,14vw,13rem)] flex min-h-[86svh] scroll-mt-0 flex-col justify-between gap-16 overflow-hidden bg-brand px-margin py-10 text-brand-text md:min-h-svh md:py-12 [&>*]:relative"
    >
      <div className="max-w-[34rem]">
        <h2 id="contato-titulo" className="text-lead tracking-[-0.015em]">
          Contato
        </h2>
        <p className="mt-3 text-lead leading-snug">Conte a data, o lugar e quantas pessoas. Respondemos com uma proposta.</p>
      </div>

      {display && displayHref ? (
        <a
          href={displayHref}
          target={settings.email ? undefined : "_blank"}
          rel={settings.email ? undefined : "noopener"}
          className="block text-[clamp(2.75rem,11.5vw,13rem)] leading-[0.95] font-medium tracking-[-0.04em] break-all transition-colors duration-300 text-brand-ink hover:text-white md:break-normal"
        >
          {display}
        </a>
      ) : null}

      <div className="flex flex-col gap-3 text-small md:flex-row md:justify-between">
        <p className="flex flex-col gap-1">
          {phone && <span>{phone}</span>}
          <span>{settings.city || "Belo Horizonte, MG"}</span>
        </p>
        <ul className="flex flex-col gap-1 md:flex-row md:gap-6">
          {wa && (
            <li>
              <a href={wa} target="_blank" rel="noopener" className="link-quiet">
                WhatsApp
              </a>
            </li>
          )}
          {ig && (
            <li>
              <a href={ig} target="_blank" rel="noopener" className="link-quiet">
                Instagram
              </a>
            </li>
          )}
          {settings.email && (
            <li>
              <a href={`mailto:${settings.email}`} className="link-quiet">
                E-mail
              </a>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
