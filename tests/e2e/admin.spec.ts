import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@festdecor.local";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "teste-local-123";
const TITLE = `Projeto E2E ${Date.now()}`;
const UPLOAD_NAME = "e2e-upload.jpg";

/** Uma foto de teste gerada na hora, para o repositório não precisar guardar imagens. */
async function testPhoto() {
  const buffer = await sharp({ create: { width: 1200, height: 900, channels: 3, background: "#9b5030" } })
    .composite([{ input: Buffer.from('<svg width="1200" height="900"><circle cx="600" cy="450" r="300" fill="#f4d3b4"/></svg>') }])
    .jpeg()
    .toBuffer();
  return { name: UPLOAD_NAME, mimeType: "image/jpeg", buffer };
}

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Projetos", level: 1 })).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("o painel exige autenticação no servidor", async ({ page, request, baseURL }) => {
  await page.goto("/admin/imagens");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fimagens/);

  // Um cookie forjado passa pelo proxy, mas não pela validação da sessão no servidor.
  await page.context().addCookies([{ name: "fd_session", value: "forjado", url: baseURL! }]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);

  // A rota de upload recusa sem sessão e recusa outra origem.
  const noAuth = await request.post("/api/admin/media", {
    headers: { origin: baseURL! },
    multipart: { file: { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from("x") } },
  });
  expect(noAuth.status()).toBe(401);
  const crossSite = await request.post("/api/admin/media", {
    headers: { origin: "https://malicioso.example" },
    multipart: { alt: "x" },
  });
  expect(crossSite.status()).toBe(403);
});

test("senha errada mostra erro", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator("#login-error")).toHaveText("E-mail ou senha incorretos.");
});

test("criar, destacar, reordenar, refletir no site e excluir um projeto", async ({ page }) => {
  await login(page);

  // Validação no servidor
  await page.getByRole("link", { name: "Novo projeto" }).click();
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByText("Informe o título.")).toBeVisible();

  // Criação com upload
  await page.getByLabel("Título").fill(TITLE);
  await page.getByLabel("Descrição curta").fill("Projeto criado pelo teste de ponta a ponta.");
  await page.getByLabel("Categoria").selectOption({ label: "Casamentos" });
  await page.getByLabel("Local", { exact: true }).fill("Belo Horizonte, MG");
  await page.locator('input[type="file"]').setInputFiles(await testPhoto());
  await expect(page.getByText("Capa", { exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Destaque na página inicial").check();
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByText("Projeto criado.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/projetos\/[0-9a-f-]{36}$/);

  // Entra no fim dos destaques; sobe até o topo
  await page.goto("/admin");
  const featured = page.locator("ol").first();
  await expect(featured.getByRole("link", { name: TITLE })).toBeVisible();
  for (let i = 0; i < 20; i++) {
    const up = page.getByRole("button", { name: `Subir ${TITLE}` });
    if (await up.isDisabled()) break;
    await up.click();
    await expect(featured).not.toHaveAttribute("aria-busy", "true");
  }
  await expect(featured.locator("li").first()).toContainText(TITLE);

  // Persistiu: recarregar mantém a ordem
  await page.reload();
  await expect(page.locator("ol").first().locator("li").first()).toContainText(TITLE);

  // O site público reflete o novo primeiro destaque
  await page.goto("/");
  await expect(page.locator("#destaques li").first()).toContainText(TITLE);

  // Filtro do portfólio e página do projeto
  await page.goto("/portfolio?categoria=casamentos");
  // Os botões só aparecem com duas ou mais categorias em uso; o filtro pelo endereço vale sempre.
  const filterButton = page.getByRole("button", { name: "Casamentos" });
  if (await filterButton.count()) await expect(filterButton).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: TITLE }).click();
  await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();

  // Tira dos destaques e some da home
  await page.goto("/admin");
  const row = page.locator("ul li", { has: page.getByRole("link", { name: TITLE }) });
  await row.getByRole("button", { name: "Tirar destaque" }).click();
  await expect(page.getByText("Projeto removido dos destaques.")).toBeVisible();
  await page.goto("/");
  await expect(page.locator("#destaques")).not.toContainText(TITLE);

  // Exclusão com confirmação (cancelar não exclui)
  await page.goto("/admin");
  const row2 = page.locator("ul li", { has: page.getByRole("link", { name: TITLE }) });
  await row2.getByRole("button", { name: "Excluir" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("link", { name: TITLE })).toBeVisible();
  await row2.getByRole("button", { name: "Excluir" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Excluir projeto" }).click();
  await expect(page.getByText("Projeto excluído.", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: TITLE })).toHaveCount(0);

  await page.goto(`/`);
  await expect(page.getByText(TITLE)).toHaveCount(0);

  // A imagem enviada ficou na biblioteca, sem uso, e pode ser excluída
  await page.goto("/admin/imagens");
  const card = page.locator("li", { hasText: UPLOAD_NAME }).first();
  await card.getByRole("button", { name: "Excluir" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Excluir imagem" }).click();
  await expect(page.getByText("Imagem excluída.")).toBeVisible();
});

test("WhatsApp configurado no painel chega ao site", async ({ page }) => {
  await login(page);
  await page.goto("/admin/configuracoes");
  const field = page.getByLabel("WhatsApp");
  const previous = await field.inputValue();

  await field.fill("9999");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Use DDI + DDD")).toBeVisible();

  await field.fill("5531988887777");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Configurações salvas.", { exact: false })).toBeVisible();

  await page.goto("/");
  const wa = page.getByRole("link", { name: "Enviar pelo WhatsApp" });
  await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/5531988887777\?text=/);
  await page.getByText("15 anos", { exact: true }).click();
  await expect(wa).toHaveAttribute("href", /15%20anos/);

  // Restaura o valor anterior
  await page.goto("/admin/configuracoes");
  await page.getByLabel("WhatsApp").fill(previous);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Configurações salvas.", { exact: false })).toBeVisible();
});
