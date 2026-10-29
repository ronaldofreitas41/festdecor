# Fest Decor — site institucional + painel

Site da Fest Decor (decoração, cenografia e flores para eventos em Belo Horizonte) com painel administrativo em `/admin` para gerenciar projetos, destaques, imagens, categorias e contatos.

- **Next.js 16** (App Router, Cache Components, Server Components e Server Actions), **TypeScript**, **Tailwind CSS 4**
- **PostgreSQL** com **Drizzle ORM** (migrações SQL versionadas em `drizzle/`)
- Imagens guardadas no próprio banco (convertidas para WebP com `sharp`) e servidas por `/media/[id]` com cache permanente, otimizadas pelo `next/image`
- Autenticação própria: senha com `scrypt`, sessão em cookie `httpOnly` com token aleatório (só o hash SHA-256 fica no banco), limite de tentativas por e-mail e por IP

## Rodando localmente

Requisitos: Node 22+, Docker (ou qualquer PostgreSQL 14+).

```bash
npm install
cp .env.example .env              # ajuste se não usar o Docker
docker compose up -d              # PostgreSQL em localhost:5432
npm run db:migrate                # cria as tabelas
npm run db:seed                   # categorias, configurações e projetos de demonstração
ADMIN_PASSWORD='uma-senha-forte' npm run admin:create -- --email voce@exemplo.com --name "Seu nome"
npm run dev                       # http://localhost:3000  ·  painel em /admin
```

No PowerShell, defina a senha com `$env:ADMIN_PASSWORD='uma-senha-forte'` antes do comando (ou passe `--password`).

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `DATABASE_URL` | sim | Conexão PostgreSQL. Em provedores gerenciados, inclua `?sslmode=require` quando exigido. |
| `NEXT_PUBLIC_SITE_URL` | sim em produção | URL pública (canonical, sitemap, Open Graph). Ex.: `https://festdecor.com.br` |
| `DATABASE_PREPARE` | não | `false` ao usar pooler em modo transação (PgBouncer, Supabase porta 6543). |
| `DATABASE_POOL_MAX` | não | Conexões por instância (padrão 5; use 1–3 em serverless). |
| `SEED_WHATSAPP` | não | WhatsApp inicial usado pelo seed (DDI+DDD+número). Depois, edite no painel. |
| `ADMIN_PASSWORD` | não | Usada apenas pelo script `admin:create`. |

Nenhum segredo chega ao navegador: só `NEXT_PUBLIC_SITE_URL` é pública.

## Administradoras

```bash
ADMIN_PASSWORD='senha-com-10+-caracteres' npm run admin:create -- --email ana@festdecor.com.br --name "Ana"
```

Rodar de novo com o mesmo e-mail **redefine a senha** e encerra as sessões abertas dessa pessoa. Não existe cadastro público.

## O que o painel faz

- **Projetos**: criar, editar, publicar/ocultar e excluir (com confirmação). Título, descrição curta, texto completo, categoria, local, mês, endereço da página e imagens em ordem (a primeira é a capa).
- **Destaques**: marcar/desmarcar e reordenar com as setas. O primeiro destaque também é a foto de abertura da home.
- **Imagens**: enviar várias de uma vez (fotos grandes de celular são reduzidas no navegador), escolher da biblioteca dentro do projeto, editar descrição (alt) e crédito, excluir as que não estão em uso.
- **Categorias**: criar, renomear e excluir. Elas viram os filtros do portfólio e as opções do pedido de orçamento.
- **Contato e WhatsApp**: número que recebe os pedidos de orçamento, Instagram, e-mail, telefone e cidade.

Toda alteração é validada no servidor (Zod), exige sessão válida em cada action/rota e atualiza o site na hora (`updateTag`).

### Segurança

- `src/proxy.ts` redireciona para o login quem não tem cookie (otimização); a **verificação real** acontece no servidor em cada página (`requireAdmin`), leitura (`assertAdmin` na camada de dados) e Server Action.
- Upload só aceita requisições da mesma origem, valida o conteúdo real da imagem e remove metadados (inclusive GPS).
- Login: 5 falhas por e-mail ou 20 por IP em 15 minutos bloqueiam novas tentativas; resposta com tempo constante para e-mails inexistentes.
- Cabeçalhos: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `noindex` no painel.

## Conteúdo de demonstração

O seed cria **8 projetos marcados como demonstração**, com fotos de terceiros sob licenças Creative Commons (Wikimedia Commons). Eles aparecem no site com o aviso "projeto de demonstração" e o crédito da foto, e o painel lembra de substituí-los. Antes de divulgar o site:

1. Crie os projetos reais com fotos da Fest Decor (ou edite os de demonstração, troque as fotos e desmarque "Conteúdo de demonstração").
2. Exclua os de demonstração que sobrarem (`npm run db:seed -- --reset` remove todos os de demonstração e os recria; use só em desenvolvimento).
3. As fotos fixas do site (seção Sobre e "Do primeiro encontro à festa", em `public/img/`) também são ilustrativas; substitua os arquivos mantendo os nomes e atualize `src/app/(site)/creditos/page.tsx`.

Créditos completos em `/creditos` e em `seed/images/credits.json`.

## Testes e verificações

```bash
npm run lint
npm run typecheck
npm test                 # Vitest: validação, slug, mensagem de orçamento, hash de senha
npm run build
npm run test:e2e         # Playwright contra o build (precisa do banco e de uma administradora)
```

O E2E sobe `next start` na porta 3217 e usa o Chrome instalado. Variáveis: `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` (padrão: `admin@festdecor.local` / `teste-local-123`), `E2E_BROWSER_CHANNEL` (`chrome` ou `msedge`), `E2E_PORT`. Ele cobre: bloqueio do painel sem sessão e com cookie forjado, upload recusado sem login e de outra origem, erro de senha, criação de projeto com upload, validação, destaque, reordenação persistida e refletida na home, filtro do portfólio, exclusão com confirmação e o WhatsApp do painel chegando ao link do site.

## Deploy

O build pré-renderiza a home e o portfólio lendo o banco, então **o banco precisa estar acessível durante o build** e as migrações devem rodar antes:

```bash
npm ci
npm run db:migrate
npm run build
npm start
```

### Vercel + Neon (ou Supabase)

1. Crie o banco PostgreSQL (Neon, Supabase, Railway…) e copie a URL de conexão.
2. Na Vercel, importe o repositório e defina `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` e `DATABASE_POOL_MAX=1`. Com pooler em modo transação, também `DATABASE_PREPARE=false`.
3. Em *Build Command*, use `npm run db:migrate && npm run build`.
4. Depois do primeiro deploy, rode localmente apontando para o banco de produção: `npm run db:seed` (opcional) e `npm run admin:create`.

O limite de corpo de requisição da Vercel (4,5 MB) é respeitado: o painel reduz fotos grandes antes de enviar.

### Servidor próprio (VPS, Railway, Render, Docker)

Rode `npm start` atrás de um proxy HTTPS (o cookie de sessão é `secure` em produção). O cache de páginas fica em memória por instância e é invalidado na hora a cada alteração; com **uma instância** isso funciona sem configuração. Para várias instâncias atrás de balanceador, configure um [cache handler compartilhado](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers) ou mantenha uma instância só.

### Backups

Projetos **e imagens** estão no PostgreSQL: o backup do banco (`pg_dump`) cobre tudo.

## Estrutura

```
src/
  app/(site)/          site público: home, portfólio, projeto, créditos
  app/admin/           login, painel (projetos, imagens, categorias, contato) e Server Actions
  app/api/admin/media  upload de imagens
  app/media/[id]       entrega das imagens do banco
  components/site|admin
  db/schema.ts         tabelas (Drizzle)
  lib/auth             senha e sessão
  lib/data             leituras públicas (com cache) e do painel (com autorização)
  lib/validation.ts    schemas Zod
scripts/               migrate, seed, create-admin
drizzle/               migrações SQL
seed/images/           fotos de demonstração + créditos
tests/unit | tests/e2e
```

Para alterar o banco: edite `src/db/schema.ts`, rode `npm run db:generate` e depois `npm run db:migrate`.

## Decisões

- **Imagens no PostgreSQL** em vez de um storage externo: um único serviço para configurar, backup único e funciona em qualquer hospedagem. As imagens já entram otimizadas (WebP, até 2400px) e são servidas com cache imutável e redimensionadas pelo `next/image`. Para milhares de fotos, a troca para S3/R2 fica restrita a `api/admin/media` e `media/[id]`.
- **Auth própria e pequena** em vez de um provedor: só há administradoras criadas por script; não há cadastro, OAuth nem e-mail de recuperação para manter.
- **Visual**: uma "sala escura" à luz de velas, em que as fotografias são o que brilha (tipografia Erode, da Fontshare, servida localmente). O pedido de orçamento monta a mensagem como um convite e abre direto no WhatsApp configurado.
