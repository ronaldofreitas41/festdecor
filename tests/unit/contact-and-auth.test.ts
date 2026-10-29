import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { formatMonth, formatPhone, quoteMessage, whatsappLink } from "@/lib/contact";

describe("mensagem de orçamento", () => {
  it("monta só as linhas preenchidas", () => {
    const msg = quoteMessage({ eventType: "Casamentos", month: "2027-03", guests: "100 a 200", place: " Nova Lima ", name: "Ana" });
    expect(msg).toBe(
      "Olá, Fest Decor! Meu nome é Ana. Quero um orçamento.\nEvento: Casamentos\nData: março de 2027\nConvidados: cerca de 100 a 200\nLocal: Nova Lima",
    );
    expect(quoteMessage({ eventType: "", month: "", guests: "", place: "", name: "" })).toBe("Olá, Fest Decor! Quero um orçamento.");
  });
  it("gera link do WhatsApp só com número configurado", () => {
    expect(whatsappLink("", "oi")).toBeNull();
    expect(whatsappLink("55 31 99999-8888", "olá & tchau")).toBe("https://wa.me/5531999998888?text=ol%C3%A1%20%26%20tchau");
  });
  it("formata mês e telefone", () => {
    expect(formatMonth("2026-12")).toBe("dezembro de 2026");
    expect(formatMonth("x")).toBe("");
    expect(formatPhone({ whatsapp: "5531999998888", phoneDisplay: "", instagram: "", email: "", city: "" })).toBe("(31) 99999-8888");
  });
});

describe("senhas", () => {
  it("gera hash com sal e verifica corretamente", async () => {
    const a = await hashPassword("uma senha bem longa");
    const b = await hashPassword("uma senha bem longa");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("uma senha bem longa", a)).toBe(true);
    expect(await verifyPassword("outra senha", a)).toBe(false);
    expect(await verifyPassword("x", "formato-invalido")).toBe(false);
  });
});
