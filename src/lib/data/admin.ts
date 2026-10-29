import "server-only";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { assertAdmin } from "@/lib/auth/session";

// Toda leitura do painel confirma a sessão aqui, perto dos dados (Data Access Layer).

const { projects: p, projectImages: pi, media: m, categories: c } = schema;

const coverSubquery = sql<string | null>`(
  select ${pi.mediaId} from ${pi} where ${pi.projectId} = ${p.id} order by ${pi.position} asc limit 1
)`;

export type AdminProjectRow = Awaited<ReturnType<typeof listProjects>>[number];

export async function listProjects() {
  await assertAdmin();
  return db
    .select({
      id: p.id,
      title: p.title,
      slug: p.slug,
      published: p.published,
      featured: p.featured,
      featuredOrder: p.featuredOrder,
      isDemo: p.isDemo,
      eventDate: p.eventDate,
      updatedAt: p.updatedAt,
      category: c.name,
      coverId: coverSubquery,
      imageCount: sql<number>`(select count(*)::int from ${pi} where ${pi.projectId} = ${p.id})`,
    })
    .from(p)
    .leftJoin(c, eq(c.id, p.categoryId))
    .orderBy(desc(p.updatedAt));
}

export async function getProjectForEdit(id: string) {
  await assertAdmin();
  const [project] = await db.select().from(p).where(eq(p.id, id));
  if (!project) return null;
  const images = await db
    .select({ id: m.id, width: m.width, height: m.height, alt: m.alt, filename: m.filename })
    .from(pi)
    .innerJoin(m, eq(m.id, pi.mediaId))
    .where(eq(pi.projectId, id))
    .orderBy(asc(pi.position));
  return { ...project, images };
}

export type MediaItem = Awaited<ReturnType<typeof listMedia>>[number];

export async function listMedia() {
  await assertAdmin();
  return db
    .select({
      id: m.id,
      filename: m.filename,
      width: m.width,
      height: m.height,
      size: m.size,
      alt: m.alt,
      credit: m.credit,
      createdAt: m.createdAt,
      usage: sql<number>`(select count(*)::int from ${pi} where ${pi.mediaId} = ${m.id})`,
    })
    .from(m)
    .orderBy(desc(m.createdAt));
}

export async function listCategories() {
  await assertAdmin();
  return db
    .select({ id: c.id, name: c.name, slug: c.slug, position: c.position, projectCount: count(p.id) })
    .from(c)
    .leftJoin(p, eq(p.categoryId, c.id))
    .groupBy(c.id)
    .orderBy(asc(c.position), asc(c.name));
}

export async function getSettingsForEdit() {
  await assertAdmin();
  const [row] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1));
  return row ?? { whatsapp: "", instagram: "", email: "", phoneDisplay: "", city: "" };
}
