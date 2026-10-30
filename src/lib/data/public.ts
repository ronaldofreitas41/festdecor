import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, schema } from "@/db";
import type { ContactSettings } from "@/lib/contact";

export const TAGS = { projects: "projects", settings: "settings" } as const;

/** `external`: imagem de um post do Instagram, carregada direto de lá (sem otimização local). */
export type PublicImage = { id: string; width: number; height: number; alt: string; credit: string | null; external: boolean };

export type PublicProject = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  location: string;
  eventDate: string | null;
  isDemo: boolean;
  category: { name: string; slug: string } | null;
  images: PublicImage[];
};

const { projects: p, projectImages: pi, media: m, categories: c } = schema;

async function loadProjects(where: SQL | undefined, orderBy: SQL[]): Promise<PublicProject[]> {
  const rows = await db
    .select({
      id: p.id,
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      description: p.description,
      location: p.location,
      eventDate: p.eventDate,
      isDemo: p.isDemo,
      categoryName: c.name,
      categorySlug: c.slug,
    })
    .from(p)
    .leftJoin(c, eq(c.id, p.categoryId))
    .where(where)
    .orderBy(...orderBy);
  if (rows.length === 0) return [];

  const images = await db
    .select({
      projectId: pi.projectId,
      id: m.id,
      width: m.width,
      height: m.height,
      alt: m.alt,
      credit: m.credit,
      external: sql<boolean>`${m.sourceUrl} is not null`,
    })
    .from(pi)
    .innerJoin(m, eq(m.id, pi.mediaId))
    .where(inArray(pi.projectId, rows.map((r) => r.id)))
    .orderBy(asc(pi.position));

  return rows.map(({ categoryName, categorySlug, ...r }) => ({
    ...r,
    category: categoryName && categorySlug ? { name: categoryName, slug: categorySlug } : null,
    images: images
      .filter((i) => i.projectId === r.id)
      .map((i) => ({ id: i.id, width: i.width, height: i.height, alt: i.alt, credit: i.credit, external: i.external })),
  }));
}

/** Destaques na ordem definida no painel. Só entram projetos publicados e com imagem. */
export async function getFeaturedProjects(): Promise<PublicProject[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("max");
  const list = await loadProjects(and(eq(p.published, true), eq(p.featured, true)), [
    asc(p.featuredOrder),
    desc(p.createdAt),
  ]);
  return list.filter((x) => x.images.length > 0);
}

export async function getPublishedProjects(): Promise<PublicProject[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("max");
  return loadProjects(and(eq(p.published, true)), [desc(p.eventDate), desc(p.createdAt)]);
}

export async function getProjectBySlug(slug: string): Promise<PublicProject | null> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("max");
  const [project] = await loadProjects(and(eq(p.published, true), eq(p.slug, slug)), [asc(p.createdAt)]);
  return project ?? null;
}

export async function getPublishedSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("max");
  const rows = await db.select({ slug: p.slug }).from(p).where(eq(p.published, true));
  return rows.map((r) => r.slug);
}

/** Categorias que têm ao menos um projeto publicado (para os filtros do portfólio). */
export async function getActiveCategories(): Promise<{ name: string; slug: string }[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("max");
  return db
    .selectDistinct({ name: c.name, slug: c.slug, position: c.position })
    .from(c)
    .innerJoin(p, and(eq(p.categoryId, c.id), eq(p.published, true)))
    .orderBy(asc(c.position), asc(c.name))
    .then((rows) => rows.map(({ name, slug }) => ({ name, slug })));
}

export async function getEventTypes(): Promise<string[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("max");
  const rows = await db.select({ name: c.name }).from(c).orderBy(asc(c.position), asc(c.name));
  return rows.map((r) => r.name);
}

/** Créditos das imagens de terceiros usadas em projetos publicados. */
export async function getPublishedCredits(): Promise<{ credit: string; project: string; slug: string }[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("max");
  return db
    .select({ credit: sql<string>`${m.credit}`, project: p.title, slug: p.slug })
    .from(pi)
    .innerJoin(m, eq(m.id, pi.mediaId))
    .innerJoin(p, eq(p.id, pi.projectId))
    .where(and(eq(p.published, true), isNotNull(m.credit), sql`${m.credit} <> ''`))
    .orderBy(asc(p.title));
}

const DEFAULT_SETTINGS: ContactSettings = {
  whatsapp: "",
  instagram: "festdecorbhmg",
  email: "",
  phoneDisplay: "",
  city: "Belo Horizonte, MG",
};

export async function getSiteSettings(): Promise<ContactSettings> {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife("max");
  const [row] = await db
    .select({
      whatsapp: schema.siteSettings.whatsapp,
      instagram: schema.siteSettings.instagram,
      email: schema.siteSettings.email,
      phoneDisplay: schema.siteSettings.phoneDisplay,
      city: schema.siteSettings.city,
    })
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.id, 1));
  return row ?? DEFAULT_SETTINGS;
}
