"use server";

import { and, asc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { db, schema } from "@/db";
import { assertAdmin, UnauthorizedError } from "@/lib/auth/session";
import { TAGS } from "@/lib/data/public";
import {
  categorySchema,
  fieldErrors,
  mediaAltSchema,
  projectFormToObject,
  projectSchema,
  settingsSchema,
  slugify,
} from "@/lib/validation";

export type ActionResult = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  id?: string;
};

const { projects: p, projectImages: pi, media: m, categories: c } = schema;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Autoriza, executa e converte falhas em mensagens para a interface. */
async function guarded(run: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    await assertAdmin();
    return await run();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthorizedError) return { ok: false, message: error.message };
    console.error("[admin action]", error);
    return { ok: false, message: "Não foi possível salvar. Tente novamente em instantes." };
  }
}

const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

async function uniqueSlug(tx: Tx, base: string, exceptId?: string) {
  const root = base || "projeto";
  let candidate = root;
  for (let i = 2; ; i++) {
    const [hit] = await tx
      .select({ id: p.id })
      .from(p)
      .where(exceptId ? and(eq(p.slug, candidate), ne(p.id, exceptId)) : eq(p.slug, candidate))
      .limit(1);
    if (!hit) return candidate;
    candidate = `${root}-${i}`;
  }
}

/** Renumera os destaques em 0..n-1 mantendo a ordem atual. */
async function compactFeatured(tx: Tx) {
  const rows = await tx
    .select({ id: p.id })
    .from(p)
    .where(eq(p.featured, true))
    .orderBy(asc(p.featuredOrder), asc(p.createdAt));
  for (const [i, row] of rows.entries()) {
    await tx.update(p).set({ featuredOrder: i }).where(eq(p.id, row.id));
  }
}

async function nextFeaturedOrder(tx: Tx) {
  const [row] = await tx
    .select({ max: sql<number | null>`max(${p.featuredOrder})` })
    .from(p)
    .where(eq(p.featured, true));
  return (row?.max ?? -1) + 1;
}

// ─── Projetos ────────────────────────────────────────────────────────────────

export async function saveProject(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    const rawId = form.get("id");
    const id = isUuid(rawId) ? rawId : undefined;
    const parsed = projectSchema.safeParse(projectFormToObject(form));
    if (!parsed.success) {
      return { ok: false, message: "Revise os campos destacados.", errors: fieldErrors(parsed.error) };
    }
    const input = parsed.data;
    const isDemo = form.get("isDemo") === "on";

    if (input.imageIds.length) {
      const found = await db.select({ id: m.id }).from(m).where(inArray(m.id, input.imageIds));
      if (found.length !== input.imageIds.length) {
        return { ok: false, message: "Uma das imagens selecionadas não existe mais. Atualize a página." };
      }
    }
    if (input.featured && input.imageIds.length === 0) {
      return { ok: false, errors: { imageIds: "Projetos em destaque precisam de pelo menos uma imagem." } };
    }
    if (input.categoryId) {
      const [cat] = await db.select({ id: c.id }).from(c).where(eq(c.id, input.categoryId));
      if (!cat) return { ok: false, errors: { categoryId: "Categoria não encontrada." } };
    }

    const savedId = await db.transaction(async (tx) => {
      const current = id
        ? (await tx.select({ featured: p.featured, featuredOrder: p.featuredOrder }).from(p).where(eq(p.id, id)))[0]
        : undefined;
      if (id && !current) throw new Error("not-found");

      const slug = await uniqueSlug(tx, input.slug || slugify(input.title), id);
      let featuredOrder: number | null = null;
      if (input.featured) {
        featuredOrder = current?.featured && current.featuredOrder !== null ? current.featuredOrder : await nextFeaturedOrder(tx);
      }
      const values = {
        title: input.title,
        slug,
        summary: input.summary,
        description: input.description,
        categoryId: input.categoryId,
        location: input.location,
        eventDate: input.eventDate,
        published: input.published,
        featured: input.featured,
        featuredOrder,
        isDemo,
      };

      let projectId = id;
      if (projectId) {
        await tx.update(p).set(values).where(eq(p.id, projectId));
        await tx.delete(pi).where(eq(pi.projectId, projectId));
      } else {
        const [row] = await tx.insert(p).values(values).returning({ id: p.id });
        projectId = row.id;
      }
      if (input.imageIds.length) {
        await tx
          .insert(pi)
          .values(input.imageIds.map((mediaId, position) => ({ projectId: projectId!, mediaId, position })));
      }
      await compactFeatured(tx);
      return projectId;
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message === "not-found") return null;
      throw error;
    });

    if (!savedId) return { ok: false, message: "Este projeto foi excluído por outra pessoa." };
    updateTag(TAGS.projects);
    return { ok: true, id: savedId, message: id ? "Projeto atualizado." : "Projeto criado." };
  });
}

export async function deleteProject(id: string): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    if (!isUuid(id)) return { ok: false, message: "Projeto inválido." };
    const deleted = await db.transaction(async (tx) => {
      const rows = await tx.delete(p).where(eq(p.id, id)).returning({ id: p.id });
      await compactFeatured(tx);
      return rows.length;
    });
    if (!deleted) return { ok: false, message: "O projeto já havia sido excluído." };
    updateTag(TAGS.projects);
    return { ok: true, message: "Projeto excluído. As imagens continuam na biblioteca." };
  });
}

export async function setFeatured(id: string, featured: boolean): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    if (!isUuid(id)) return { ok: false, message: "Projeto inválido." };
    const result = await db.transaction(async (tx) => {
      const [project] = await tx.select({ id: p.id, featured: p.featured }).from(p).where(eq(p.id, id));
      if (!project) return "missing" as const;
      if (featured) {
        const [img] = await tx.select({ id: pi.mediaId }).from(pi).where(eq(pi.projectId, id)).limit(1);
        if (!img) return "no-image" as const;
      }
      if (project.featured !== featured) {
        await tx
          .update(p)
          .set({ featured, featuredOrder: featured ? await nextFeaturedOrder(tx) : null })
          .where(eq(p.id, id));
        await compactFeatured(tx);
      }
      return "ok" as const;
    });
    if (result === "missing") return { ok: false, message: "Projeto não encontrado." };
    if (result === "no-image") return { ok: false, message: "Adicione uma imagem ao projeto antes de destacá-lo." };
    updateTag(TAGS.projects);
    return { ok: true, message: featured ? "Projeto adicionado aos destaques." : "Projeto removido dos destaques." };
  });
}

export async function setPublished(id: string, published: boolean): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    if (!isUuid(id)) return { ok: false, message: "Projeto inválido." };
    const rows = await db.update(p).set({ published }).where(eq(p.id, id)).returning({ id: p.id });
    if (!rows.length) return { ok: false, message: "Projeto não encontrado." };
    updateTag(TAGS.projects);
    return { ok: true, message: published ? "Projeto publicado no site." : "Projeto ocultado do site." };
  });
}

/** Grava a nova ordem dos destaques. `ids` precisa conter exatamente os destaques atuais. */
export async function reorderFeatured(ids: string[]): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    if (!Array.isArray(ids) || !ids.every(isUuid) || new Set(ids).size !== ids.length) {
      return { ok: false, message: "Ordem inválida." };
    }
    const ok = await db.transaction(async (tx) => {
      const current = await tx.select({ id: p.id }).from(p).where(and(eq(p.featured, true), isNotNull(p.featuredOrder)));
      const currentIds = new Set(current.map((r) => r.id));
      if (currentIds.size !== ids.length || !ids.every((x) => currentIds.has(x))) return false;
      for (const [i, projectId] of ids.entries()) {
        await tx.update(p).set({ featuredOrder: i }).where(eq(p.id, projectId));
      }
      return true;
    });
    if (!ok) return { ok: false, message: "Os destaques mudaram enquanto você editava. A lista foi atualizada." };
    updateTag(TAGS.projects);
    return { ok: true, message: "Ordem dos destaques salva." };
  });
}

// ─── Imagens ─────────────────────────────────────────────────────────────────

export async function updateMedia(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    const parsed = mediaAltSchema.safeParse({
      id: form.get("id"),
      alt: form.get("alt") ?? "",
      credit: form.get("credit") ?? "",
    });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Revise os campos." };
    const { id, alt, credit } = parsed.data;
    const rows = await db.update(m).set({ alt, credit: credit || null }).where(eq(m.id, id)).returning({ id: m.id });
    if (!rows.length) return { ok: false, message: "Imagem não encontrada." };
    updateTag(TAGS.projects);
    return { ok: true, message: "Imagem atualizada." };
  });
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    if (!isUuid(id)) return { ok: false, message: "Imagem inválida." };
    const usedBy = await db
      .select({ title: p.title })
      .from(pi)
      .innerJoin(p, eq(p.id, pi.projectId))
      .where(eq(pi.mediaId, id));
    if (usedBy.length) {
      return {
        ok: false,
        message: `Esta imagem está em uso em: ${usedBy.map((u) => u.title).join(", ")}. Remova-a desses projetos antes de excluir.`,
      };
    }
    const rows = await db.delete(m).where(eq(m.id, id)).returning({ id: m.id });
    if (!rows.length) return { ok: false, message: "A imagem já havia sido excluída." };
    return { ok: true, message: "Imagem excluída." };
  });
}

// ─── Categorias ──────────────────────────────────────────────────────────────

export async function saveCategory(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    const rawId = form.get("id");
    const id = isUuid(rawId) ? rawId : undefined;
    const parsed = categorySchema.safeParse({ name: form.get("name") ?? "" });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const slug = slugify(parsed.data.name);
    if (!slug) return { ok: false, errors: { name: "Use letras ou números no nome." } };
    const [clash] = await db
      .select({ id: c.id })
      .from(c)
      .where(id ? and(eq(c.slug, slug), ne(c.id, id)) : eq(c.slug, slug));
    if (clash) return { ok: false, errors: { name: "Já existe uma categoria com esse nome." } };

    if (id) {
      const rows = await db.update(c).set({ name: parsed.data.name, slug }).where(eq(c.id, id)).returning({ id: c.id });
      if (!rows.length) return { ok: false, message: "Categoria não encontrada." };
    } else {
      const [row] = await db.select({ max: sql<number | null>`max(${c.position})` }).from(c);
      await db.insert(c).values({ name: parsed.data.name, slug, position: (row?.max ?? -1) + 1 });
    }
    updateTag(TAGS.projects);
    return { ok: true, message: id ? "Categoria renomeada." : "Categoria criada." };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    if (!isUuid(id)) return { ok: false, message: "Categoria inválida." };
    const rows = await db.delete(c).where(eq(c.id, id)).returning({ id: c.id });
    if (!rows.length) return { ok: false, message: "A categoria já havia sido excluída." };
    updateTag(TAGS.projects);
    return { ok: true, message: "Categoria excluída. Os projetos dela ficaram sem categoria." };
  });
}

// ─── Configurações ───────────────────────────────────────────────────────────

export async function saveSettings(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    const parsed = settingsSchema.safeParse({
      whatsapp: form.get("whatsapp") ?? "",
      instagram: form.get("instagram") ?? "",
      email: form.get("email") ?? "",
      phoneDisplay: form.get("phoneDisplay") ?? "",
      city: form.get("city") ?? "",
    });
    if (!parsed.success) return { ok: false, message: "Revise os campos destacados.", errors: fieldErrors(parsed.error) };
    await db
      .insert(schema.siteSettings)
      .values({ id: 1, ...parsed.data })
      .onConflictDoUpdate({ target: schema.siteSettings.id, set: parsed.data });
    updateTag(TAGS.settings);
    return { ok: true, message: "Configurações salvas. O site já foi atualizado." };
  });
}
