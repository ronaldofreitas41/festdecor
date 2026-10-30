import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  ...timestamps,
});

/** Sessões de administradores. O id é o SHA-256 do token guardado no cookie. */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Tentativas de login, usadas para limitar força bruta por e-mail e por IP. */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    ip: text("ip").notNull(),
    success: boolean("success").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("login_attempts_email_idx").on(t.email, t.createdAt),
    index("login_attempts_ip_idx").on(t.ip, t.createdAt),
  ],
);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  position: integer("position").notNull().default(0),
  ...timestamps,
});

/**
 * Imagens. Enviadas pelo painel: os bytes ficam no próprio banco (WebP já otimizado).
 * Do Instagram: só o link do post fica guardado (`sourceUrl`); a imagem é carregada direto de lá.
 */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  size: integer("size").notNull(),
  alt: text("alt").notNull().default(""),
  /** Crédito exibido no site (obrigatório para imagens de terceiros). */
  credit: text("credit"),
  /** Bytes da imagem enviada; nulo quando a imagem vem de um post do Instagram. */
  data: bytea("data"),
  /** Link do post do Instagram (https://www.instagram.com/p/…/). */
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull().default(""),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    location: text("location").notNull().default(""),
    eventDate: text("event_date"),
    published: boolean("published").notNull().default(true),
    featured: boolean("featured").notNull().default(false),
    /** Ordem entre os destaques (menor aparece primeiro). Nulo quando não é destaque. */
    featuredOrder: integer("featured_order"),
    /** Conteúdo de demonstração: aparece com aviso no site até ser substituído. */
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("projects_slug_idx").on(t.slug),
    index("projects_featured_idx").on(t.featured, t.featuredOrder),
    index("projects_category_idx").on(t.categoryId),
  ],
);

export const projectImages = pgTable(
  "project_images",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    /** 0 é a capa. */
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.mediaId] }), index("project_images_media_idx").on(t.mediaId)],
);

/** Configurações do site editáveis no painel (linha única, id = 1). */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  whatsapp: text("whatsapp").notNull().default(""),
  instagram: text("instagram").notNull().default("festdecorbhmg"),
  email: text("email").notNull().default(""),
  phoneDisplay: text("phone_display").notNull().default(""),
  city: text("city").notNull().default("Belo Horizonte, MG"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new Date()),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  category: one(categories, { fields: [projects.categoryId], references: [categories.id] }),
  images: many(projectImages),
}));

export const projectImagesRelations = relations(projectImages, ({ one }) => ({
  project: one(projects, { fields: [projectImages.projectId], references: [projects.id] }),
  media: one(media, { fields: [projectImages.mediaId], references: [media.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  projects: many(projects),
}));
