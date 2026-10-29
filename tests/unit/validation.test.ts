import { describe, expect, it } from "vitest";
import { projectFormToObject, projectSchema, settingsSchema, slugify } from "@/lib/validation";

describe("slugify", () => {
  it("remove acentos e símbolos", () => {
    expect(slugify("Mesa Imperial — Pão de Açúcar!")).toBe("mesa-imperial-pao-de-acucar");
  });
  it("lida com texto vazio", () => {
    expect(slugify("  ##  ")).toBe("");
  });
});

const valid = {
  title: "Casamento no jardim",
  slug: "",
  summary: "Uma descrição curta suficiente.",
  description: "",
  categoryId: "",
  location: "Nova Lima, MG",
  eventDate: "2026-05",
  published: true,
  featured: false,
  imageIds: ["7f1d1c8e-2b8a-4c55-9a51-0e1d2f3a4b5c"],
};

describe("projectSchema", () => {
  it("aceita um projeto válido e normaliza campos vazios", () => {
    const r = projectSchema.parse(valid);
    expect(r.categoryId).toBeNull();
    expect(r.eventDate).toBe("2026-05");
  });
  it("rejeita título curto, data inválida e imagens repetidas", () => {
    const r = projectSchema.safeParse({
      ...valid,
      title: "a",
      eventDate: "2026-13",
      imageIds: [valid.imageIds[0], valid.imageIds[0]],
    });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["title", "eventDate", "imageIds"]));
  });
  it("rejeita ids que não são UUID (evita injeção pelo formulário)", () => {
    expect(projectSchema.safeParse({ ...valid, imageIds: ["1 OR 1=1"] }).success).toBe(false);
  });
  it("lê o FormData mantendo a ordem das imagens", () => {
    const fd = new FormData();
    fd.set("title", "X");
    fd.append("imageIds", "b");
    fd.append("imageIds", "a");
    fd.set("featured", "on");
    const o = projectFormToObject(fd);
    expect(o.imageIds).toEqual(["b", "a"]);
    expect(o.featured).toBe(true);
    expect(o.published).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("limpa o WhatsApp e o @ do Instagram", () => {
    const r = settingsSchema.parse({
      whatsapp: "+55 (31) 99999-8888",
      instagram: "https://www.instagram.com/festdecorbhmg/",
      email: "",
      phoneDisplay: "",
      city: "BH",
    });
    expect(r.whatsapp).toBe("5531999998888");
    expect(r.instagram).toBe("festdecorbhmg");
  });
  it("rejeita número curto", () => {
    expect(settingsSchema.safeParse({ whatsapp: "9999", instagram: "", email: "", phoneDisplay: "", city: "" }).success).toBe(false);
  });
});
