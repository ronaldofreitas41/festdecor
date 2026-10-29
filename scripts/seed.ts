/**
 * Dados iniciais: categorias, configurações e projetos de DEMONSTRAÇÃO.
 *   npm run db:seed            cria o que faltar (não duplica)
 *   npm run db:seed -- --reset apaga projetos/imagens de demonstração e recria
 *
 * As fotos de demonstração são de terceiros (Wikimedia Commons, licenças CC) e
 * ficam marcadas como demonstração no site até a equipe substituí-las por fotos reais.
 */
import fs from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { processImage } from "../src/lib/media/process";
import { client, db, schema } from "./db";

type Credit = { file: string; title: string; author: string; license: string; source: string };

const reset = process.argv.includes("--reset");
const imagesDir = path.join(process.cwd(), "seed", "images");
const credits: Credit[] = JSON.parse(fs.readFileSync(path.join(imagesDir, "credits.json"), "utf8"));

const CATEGORIES = [
  { name: "Casamentos", slug: "casamentos" },
  { name: "Mini wedding", slug: "mini-wedding" },
  { name: "15 anos", slug: "15-anos" },
  { name: "Aniversários", slug: "aniversarios" },
  { name: "Corporativo", slug: "corporativo" },
];

const NOTE = "\n\nProjeto de demonstração: substitua este texto e as fotos pelo projeto real no painel.";

const PROJECTS: {
  title: string;
  slug: string;
  category: string;
  location: string;
  eventDate: string;
  summary: string;
  description: string;
  images: { file: string; alt: string }[];
  featured: boolean;
}[] = [
  {
    title: "Mesa imperial em branco",
    slug: "demo-mesa-imperial-em-branco",
    category: "casamentos",
    location: "Nova Lima, MG",
    eventDate: "2026-05",
    summary: "Uma mesa única para 40 convidados, coberta por orquídeas, peônias e rosas brancas.",
    description:
      "A mesa imperial corre o salão inteiro, com um caminho contínuo de flores brancas e folhagens soltas, taças de cristal e guardanapos de linho." +
      NOTE,
    images: [{ file: "mesa-flores-brancas.jpg", alt: "Mesa posta com caminho de orquídeas e rosas brancas" }],
    featured: true,
  },
  {
    title: "Jantar à luz de velas",
    slug: "demo-jantar-a-luz-de-velas",
    category: "mini-wedding",
    location: "Belo Horizonte, MG",
    eventDate: "2026-03",
    summary: "Mini wedding para 20 pessoas com candelabros, madeira e luz baixa.",
    description:
      "Um jantar íntimo em que a iluminação vem quase toda das velas: candelabros de metal, sousplats de fibra natural e louça clássica." +
      NOTE,
    images: [{ file: "jantar-velas.jpg", alt: "Mesa de jantar com candelabro aceso e taças" }],
    featured: true,
  },
  {
    title: "Colunas de luz",
    slug: "demo-colunas-de-luz",
    category: "casamentos",
    location: "Brumadinho, MG",
    eventDate: "2025-11",
    summary: "Cortinas de luzes quentes vestindo as colunas do salão e o letreiro LOVE na pista.",
    description:
      "A cenografia usa a arquitetura do espaço: cada coluna recebe uma cortina de luzes quentes, e o letreiro iluminado marca a entrada da pista." +
      NOTE,
    images: [
      { file: "colunas-luzes.jpg", alt: "Colunas envoltas em cortinas de luzes quentes" },
      { file: "letreiro-love.jpg", alt: "Letreiro LOVE iluminado diante da mesa dos noivos" },
    ],
    featured: true,
  },
  {
    title: "Arranjos altos em lilás",
    slug: "demo-arranjos-altos-em-lilas",
    category: "15-anos",
    location: "Belo Horizonte, MG",
    eventDate: "2025-09",
    summary: "Hortênsias, rosas e lisiantos em hastes altas, montados no próprio local.",
    description:
      "Os arranjos em hastes metálicas deixam a linha de visão livre entre os convidados, e as bases repetem as mesmas flores em coroas baixas." +
      NOTE,
    images: [{ file: "arranjos-altos.jpg", alt: "Arranjos altos de hortênsias lilás sendo montados" }],
    featured: true,
  },
  {
    title: "Cortinas e rosas azuis",
    slug: "demo-cortinas-e-rosas-azuis",
    category: "15-anos",
    location: "Contagem, MG",
    eventDate: "2025-07",
    summary: "Um corredor de cortinas drapeadas presas por buquês de rosas azuis.",
    description:
      "A entrada vira um corredor cenográfico com tecido drapeado, paredes de flores brancas e amarrações de rosas azuis." + NOTE,
    images: [{ file: "cortinas-rosas.jpg", alt: "Cortina drapeada presa com rosas azuis e parede de flores brancas" }],
    featured: true,
  },
  {
    title: "Salão dourado",
    slug: "demo-salao-dourado",
    category: "casamentos",
    location: "Belo Horizonte, MG",
    eventDate: "2025-05",
    summary: "Recepção para 180 convidados com cadeiras tiffany e mesas redondas em tons de rosa.",
    description: "Mesas redondas numeradas, castiçais de madeira e arranjos baixos em caixas rústicas." + NOTE,
    images: [{ file: "salao-banquete.jpg", alt: "Salão com mesas redondas, cadeiras douradas e castiçais" }],
    featured: false,
  },
  {
    title: "Almoço no jardim",
    slug: "demo-almoco-no-jardim",
    category: "aniversarios",
    location: "Lagoa Santa, MG",
    eventDate: "2025-04",
    summary: "Mesa ao ar livre com frutas, velas e um arranjo alto de rosas vermelhas.",
    description:
      "Um aniversário ao ar livre com mesa comprida, guardanapos verdes e limões-sicilianos como parte da decoração." + NOTE,
    images: [{ file: "mesa-rustica.jpg", alt: "Mesa ao ar livre com arranjo de rosas, velas e limões" }],
    featured: false,
  },
  {
    title: "Buquê de rosas e gipsófilas",
    slug: "demo-buque-de-rosas-e-gipsofilas",
    category: "casamentos",
    location: "Sabará, MG",
    eventDate: "2025-02",
    summary: "Buquê da noiva em rosas cor-de-rosa e gipsófilas, combinando com a decoração do salão.",
    description: "O buquê repete as flores das mesas para que as fotos da cerimônia e da festa conversem entre si." + NOTE,
    images: [{ file: "buque-noiva.jpg", alt: "Noiva segurando buquê de rosas cor-de-rosa" }],
    featured: false,
  },
];

function creditFor(file: string) {
  const c = credits.find((x) => x.file === file);
  return c ? `Foto: ${c.author}, ${c.license}, Wikimedia Commons` : null;
}

// Categorias
for (const [i, c] of CATEGORIES.entries()) {
  await db.insert(schema.categories).values({ ...c, position: i }).onConflictDoNothing({ target: schema.categories.slug });
}
const cats = await db.select().from(schema.categories);
const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));

// Configurações (linha única)
await db
  .insert(schema.siteSettings)
  .values({ id: 1, whatsapp: process.env.SEED_WHATSAPP ?? "", instagram: "festdecorbhmg", city: "Belo Horizonte, MG" })
  .onConflictDoNothing();

if (reset) {
  const demo = await db.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.isDemo, true));
  const ids = demo.map((d) => d.id);
  if (ids.length) {
    const imgs = await db
      .select({ mediaId: schema.projectImages.mediaId })
      .from(schema.projectImages)
      .where(inArray(schema.projectImages.projectId, ids));
    await db.delete(schema.projects).where(inArray(schema.projects.id, ids));
    const mediaIds = [...new Set(imgs.map((i) => i.mediaId))];
    const stillUsed = mediaIds.length
      ? await db
          .select({ id: schema.projectImages.mediaId })
          .from(schema.projectImages)
          .where(inArray(schema.projectImages.mediaId, mediaIds))
      : [];
    const orphan = mediaIds.filter((id) => !stillUsed.some((u) => u.id === id));
    if (orphan.length) await db.delete(schema.media).where(inArray(schema.media.id, orphan));
  }
  console.log(`Removidos ${ids.length} projetos de demonstração.`);
}

const existingSlugs = new Set((await db.select({ slug: schema.projects.slug }).from(schema.projects)).map((p) => p.slug));
let featuredOrder = (
  await db.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.featured, true))
).length;
let created = 0;

for (const p of PROJECTS) {
  if (existingSlugs.has(p.slug)) continue;
  const processed = await Promise.all(p.images.map((img) => processImage(fs.readFileSync(path.join(imagesDir, img.file)))));
  await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(schema.projects)
      .values({
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        description: p.description,
        categoryId: catBySlug.get(p.category) ?? null,
        location: p.location,
        eventDate: p.eventDate,
        featured: p.featured,
        featuredOrder: p.featured ? featuredOrder++ : null,
        isDemo: true,
      })
      .returning({ id: schema.projects.id });
    for (const [position, img] of p.images.entries()) {
      const [m] = await tx
        .insert(schema.media)
        .values({ filename: img.file, alt: img.alt, credit: creditFor(img.file), ...processed[position] })
        .returning({ id: schema.media.id });
      await tx.insert(schema.projectImages).values({ projectId: project.id, mediaId: m.id, position });
    }
  });
  created++;
}

console.log(`Seed concluído: ${CATEGORIES.length} categorias, ${created} projetos de demonstração criados.`);
await client.end();
