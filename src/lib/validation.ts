import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Use no máximo ${max} caracteres.`);

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

const uuid = z.uuid("Identificador inválido.");

export const projectSchema = z.object({
  title: text(120).min(2, "Informe o título."),
  slug: z
    .string()
    .trim()
    .max(80)
    .transform((v) => slugify(v))
    .optional(),
  summary: text(240).min(10, "Escreva uma descrição curta (pelo menos 10 caracteres)."),
  description: text(5000).default(""),
  categoryId: z.union([uuid, z.literal("")]).transform((v) => (v === "" ? null : v)),
  location: text(120).default(""),
  eventDate: z
    .union([z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato AAAA-MM."), z.literal("")])
    .transform((v) => (v === "" ? null : v)),
  published: z.boolean(),
  featured: z.boolean(),
  imageIds: z.array(uuid).max(40, "Use no máximo 40 imagens por projeto.").refine((ids) => new Set(ids).size === ids.length, {
    message: "A mesma imagem foi adicionada duas vezes.",
  }),
});

export type ProjectInput = z.infer<typeof projectSchema>;

/** Converte o FormData do formulário de projeto no formato do schema. */
export function projectFormToObject(form: FormData) {
  return {
    title: String(form.get("title") ?? ""),
    slug: String(form.get("slug") ?? ""),
    summary: String(form.get("summary") ?? ""),
    description: String(form.get("description") ?? ""),
    categoryId: String(form.get("categoryId") ?? ""),
    location: String(form.get("location") ?? ""),
    eventDate: String(form.get("eventDate") ?? ""),
    published: form.get("published") === "on",
    featured: form.get("featured") === "on",
    imageIds: form.getAll("imageIds").map(String),
  };
}

export const categorySchema = z.object({
  name: text(60).min(2, "Informe o nome da categoria."),
});

export const settingsSchema = z.object({
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || (v.length >= 12 && v.length <= 13), "Use DDI + DDD + número, ex.: 5531999999999."),
  instagram: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, ""))
    .refine((v) => v === "" || /^[a-zA-Z0-9._]{1,30}$/.test(v), "Usuário do Instagram inválido."),
  email: z.union([z.email("E-mail inválido.").trim().max(120), z.literal("")]),
  phoneDisplay: text(40).default(""),
  city: text(80).default(""),
});

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim().toLowerCase().max(200),
  password: z.string().min(1, "Informe a senha.").max(200),
});

export const mediaAltSchema = z.object({
  id: uuid,
  alt: text(200),
  credit: text(200),
});

/** Primeira mensagem de erro por campo, para exibir no formulário. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
