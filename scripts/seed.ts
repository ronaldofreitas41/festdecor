/**
 * Dados iniciais: categorias, configurações e os primeiros projetos da Fest Decor,
 * com fotos de posts do Instagram @festdecorbhmg. Só o link do post fica no banco; a imagem é
 * carregada direto do Instagram (veja src/lib/media/instagram.ts).
 *   npm run db:seed            cria o que faltar (não duplica)
 *   npm run db:seed -- --reset apaga também os antigos projetos de demonstração (is_demo) e suas imagens
 *
 * Os textos resumem as legendas dos posts. Categoria e data ficam em branco quando a legenda não diz;
 * complete pelo painel.
 */
import { eq, inArray } from "drizzle-orm";
import { client, db, schema } from "./db";

const reset = process.argv.includes("--reset");

const CATEGORIES = [
  { name: "Casamentos", slug: "casamentos" },
  { name: "Mini wedding", slug: "mini-wedding" },
  { name: "15 anos", slug: "15-anos" },
  { name: "Aniversários", slug: "aniversarios" },
  { name: "Corporativo", slug: "corporativo" },
];

const PROJECTS: {
  title: string;
  slug: string;
  category: string | null;
  location: string;
  summary: string;
  description: string;
  /** Posts do Instagram; largura e altura da imagem original, para reservar o espaço na página. */
  images: { post: string; width: number; height: number; alt: string }[];
  featured: boolean;
}[] = [
  {
    title: "Carol e Mateus",
    slug: "carol-e-mateus",
    category: "casamentos",
    location: "Anella Spazio Eventi",
    summary: "Um casamento conceitual em bordô e pistache, com uma decoração que acompanha a personalidade do casal.",
    description:
      "Carol e Mateus quiseram uma celebração fora do convencional. O bordô e o pistache aparecem lado a lado, num contraste sofisticado e marcante, e cada escolha da decoração parte do jeito dos dois.",
    images: [
      {
        post: "https://www.instagram.com/p/Dez6d9Km6Fz/",
        width: 1024,
        height: 1365,
        alt: "Carol e Mateus abraçados diante de uma cortina iluminada em tons terrosos",
      },
      {
        post: "https://www.instagram.com/reel/Dc9c7j-P5NM/",
        width: 640,
        height: 1136,
        alt: "Noiva de vestido branco sorrindo num jardim, com um buquê de flores coloridas",
      },
    ],
    featured: true,
  },
  {
    title: "Mesa de família com luminárias bordô",
    slug: "mesa-de-familia-luminarias-bordo",
    category: null,
    location: "Anella Spazio Eventi",
    summary: "A mesa da família pensada como parte do cenário, com luminárias bordô criadas só para este projeto.",
    description:
      "As luminárias em tom bordô foram desenvolvidas exclusivamente para esta mesa. Elas dão cor e personalidade à composição e fazem da mesa um elemento cenográfico único.",
    images: [
      {
        post: "https://www.instagram.com/p/DduPkPfG_3N/",
        width: 3072,
        height: 4096,
        alt: "Mesa posta com luminárias de cúpula bordô, antúrios e caminho de tecido verde",
      },
    ],
    featured: true,
  },
  {
    title: "Lounge em bordô",
    slug: "lounge-em-bordo",
    category: null,
    location: "Anella Spazio Eventi",
    summary: "Abajures, tecidos, mobiliário e arranjos no mesmo bordô, para um lounge dramático e atemporal.",
    description:
      "O bordô conduz o ambiente inteiro: está nos abajures, nos tecidos, no mobiliário e nos arranjos. Texturas, iluminação e tons se combinam para criar um lounge marcante.",
    images: [
      {
        post: "https://www.instagram.com/p/De4C20Xm3cs/",
        width: 3071,
        height: 4096,
        alt: "Lounge com abajur bordô, mesa redonda de madeira e arranjo de flores vermelhas e brancas",
      },
    ],
    featured: true,
  },
  {
    title: "Mesas de convidados com antúrios",
    slug: "mesas-de-convidados-com-anturios",
    category: null,
    location: "Parque do Palácio",
    summary: "Arranjos de formas escultóricas, com antúrios, flores de texturas variadas e folhagens ao longo das mesas.",
    description:
      "As mesas de convidados são parte importante da experiência. Aqui, a arte floral ganha formas escultóricas: antúrios, flores de texturas diferentes e folhagens em arranjos pouco convencionais criam movimento ao longo das mesas, feitos para serem vistos de perto.",
    images: [
      {
        post: "https://www.instagram.com/p/DeupEhqGwNd/",
        width: 1706,
        height: 2274,
        alt: "Arranjo baixo com girassóis, antúrio e folhagens sobre mesa de toalha verde",
      },
    ],
    featured: true,
  },
  {
    title: "Do zero ao bordô",
    slug: "do-zero-ao-bordo",
    category: null,
    location: "Parque do Palácio",
    summary: "A sala de doces montada camada por camada, em bordô.",
    description:
      "Uma sala de doces construída do zero, camada por camada, com o bordô como fio condutor: velas, flores e tecidos.",
    images: [
      {
        post: "https://www.instagram.com/reel/Deo02Yahh52/",
        width: 720,
        height: 1280,
        alt: "Velas altas e arranjos de flores bordô e vermelhas sob um lustre",
      },
    ],
    featured: true,
  },
  {
    title: "Fazenda Quinzeiro",
    slug: "fazenda-quinzeiro",
    category: null,
    location: "Fazenda Quinzeiro",
    summary: "Composição, volume, cores e texturas numa criação assinada pela Mari.",
    description:
      "Decoração como forma de expressão: cada escolha de composição, volume, cor e textura foi pensada para este dia, numa criação da Mari.",
    images: [
      {
        post: "https://www.instagram.com/p/DcJ2ByvmxRo/",
        width: 1706,
        height: 2274,
        alt: "Mari, da Fest Decor, ao lado de uma mesa posta sob um teto de flores",
      },
    ],
    featured: false,
  },
];

// Categorias
for (const [i, c] of CATEGORIES.entries()) {
  await db
    .insert(schema.categories)
    .values({ ...c, position: i })
    .onConflictDoNothing({ target: schema.categories.slug });
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
let featuredOrder = (await db.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.featured, true)))
  .length;
let created = 0;

for (const p of PROJECTS) {
  if (existingSlugs.has(p.slug)) continue;
  await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(schema.projects)
      .values({
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        description: p.description,
        categoryId: p.category ? (catBySlug.get(p.category) ?? null) : null,
        location: p.location,
        featured: p.featured,
        featuredOrder: p.featured ? featuredOrder++ : null,
        isDemo: false,
      })
      .returning({ id: schema.projects.id });
    for (const [position, img] of p.images.entries()) {
      const [m] = await tx
        .insert(schema.media)
        .values({
          filename: img.post.split("/").at(-2)!,
          mimeType: "image/jpeg",
          width: img.width,
          height: img.height,
          size: 0,
          alt: img.alt,
          sourceUrl: img.post,
        })
        .returning({ id: schema.media.id });
      await tx.insert(schema.projectImages).values({ projectId: project.id, mediaId: m.id, position });
    }
  });
  created++;
}

console.log(`Seed concluído: ${CATEGORIES.length} categorias, ${created} projetos criados.`);
await client.end();
