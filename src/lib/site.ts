export const SITE = {
  name: "Fest Decor",
  description:
    "Decoração, cenografia e flores para casamentos, 15 anos e eventos em Belo Horizonte. Projetos autorais, do primeiro esboço à última vela acesa.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};
