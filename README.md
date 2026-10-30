# Fest Decor — site institucional + painel

Site da Fest Decor (decoração, cenografia e flores para eventos em Belo Horizonte) com painel administrativo em `/admin` para gerenciar projetos, destaques, imagens, categorias e contatos.

- **Next.js 16** (App Router, Cache Components, Server Components e Server Actions), **TypeScript**, **Tailwind CSS 4**
- **PostgreSQL** com **Drizzle ORM** (migrações SQL versionadas em `drizzle/`)
- Imagens servidas por `/media/[id]`: as fotos dos posts do Instagram são carregadas direto do Instagram (o banco guarda só o link do post); as enviadas pelo painel ficam no banco (WebP com `sharp`), com cache permanente e otimizadas pelo `next/image`
- Autenticação própria: senha com `scrypt`, sessão em cookie `httpOnly` com token aleatório (só o hash SHA-256 fica no banco), limite de tentativas por e-mail e por IP

## Rodando localmente

Requisitos: Node 22+, Docker (ou qualquer PostgreSQL 14+).

```bash
npm install
cp .env.example .env              # ajuste se não usar o Docker
docker compose up -d              # PostgreSQL em localhost:5432
npm run db:migrate                # cria as tabelas
npm run db:seed                   # categorias, configurações e os projetos com fotos do Instagram
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

## Conteúdo inicial: fotos do Instagram

O seed cria **6 projetos** a partir de posts do Instagram @festdecorbhmg (`scripts/seed.ts`). Os textos resumem as legendas; categoria e data ficam em branco quando a legenda não diz, e devem ser completadas no painel. `npm run db:seed -- --reset` também apaga projetos antigos marcados como demonstração.

**Nenhuma foto fica no repositório nem no banco.** Cada imagem é uma linha em `media` com `source_url` (o link do post, `https://www.instagram.com/p/…/`). Os endereços de imagem do Instagram são assinados e vencem em poucos dias, então `/media/[id]` lê o endereço atual na página pública de incorporação do post (`src/lib/media/instagram.ts`, renovado a cada 6 horas) e redireciona o navegador para ele. A imagem vai do Instagram direto para o navegador, sem passar pelo otimizador do Next.

- Se o post for apagado ou arquivado no Instagram, a imagem some do site: troque-a no painel.
- Isso depende da página de incorporação pública do Instagram; se ela mudar de formato, as fotos param de carregar até `instagram.ts` ser ajustado. Para não depender disso, envie as fotos pelo painel.
- O Sobre e "Do primeiro encontro à festa" usam as fotos dos projetos publicados (sem repetir a da abertura).

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
tests/unit | tests/e2e
```

Para alterar o banco: edite `src/db/schema.ts`, rode `npm run db:generate` e depois `npm run db:migrate`.

## Decisões

- **Fotos do Instagram por link**: a pedido da Fest Decor, as fotos já publicadas no Instagram não são copiadas; veja "Conteúdo inicial".
- **Imagens enviadas no PostgreSQL** em vez de um storage externo: um único serviço para configurar, backup único e funciona em qualquer hospedagem. As imagens já entram otimizadas (WebP, até 2400px) e são servidas com cache imutável e redimensionadas pelo `next/image`. Para milhares de fotos, a troca para S3/R2 fica restrita a `api/admin/media` e `media/[id]`.
- **Auth própria e pequena** em vez de um provedor: só há administradoras criadas por script; não há cadastro, OAuth nem e-mail de recuperação para manter.
- **Visual**: guiado pela logo da Fest Decor. O terracota do fundo da logo é o campo da marca (abertura, convite do orçamento, contato e botões), o creme-pêssego das letras é a cor da logo e, clareado, o chão do site; as folhas tom sobre tom vêm do fundo da logo. A abertura da home é a própria logo, redesenhada em vetor (`src/components/site/brand-logo.tsx`, com Quicksand no "decor de eventos" e Erode nos textos). Para usar o arquivo original da logo, coloque-o em `public/brand/` e troque o SVG nesse componente. O pedido de orçamento monta a mensagem como um convite e abre direto no WhatsApp configurado.
- **Fundo animado (Three.js)**: um canvas fixo atrás de todo o site (`src/components/site/scene/engine.ts`). Fitas de seda acetinada mudam de lugar conforme a seção na tela: onda baixa na abertura, faixa rente ao pé nos destaques e no Sobre, fios dourados no alto do processo e um drapeado de teto no orçamento e no contato. Entre uma cena e outra, as fitas torcem e ondulam. A rolagem é uma travessia: a câmera avança por uma galeria de arcos dourados com cortinas de voil, as luzes desfocadas (bokeh) passam em profundidade e, na rolagem rápida, o campo de visão abre e a vinheta fecha. O próprio fundo pinta a cor de cada seção (creme, terracota ou café). Onde a cor muda, a seção de baixo entra como um tecido drapeado, com dobras, sombra e brilho, e as dobras balançam com a velocidade da rolagem. As fitas se levantam perto do mouse. Cada seção declara `data-bg` (`cream`, `brand` ou `noir`) e `data-scene` (0 a 3). O fundo carrega depois do conteúdo e não roda com "reduzir movimento" nem sem WebGL; nesses casos as seções mantêm as próprias cores. No celular, usa menos pétalas e menor resolução.
- **Acabamento**: títulos em Erode regular com itálico nas palavras de ênfase; navegação, botões e legendas em caixa alta espaçada (Quicksand, classe `caps`); molduras de fio dourado deslocadas atrás das fotos (classe `gilt`); a seção do processo é o "salão à noite", em café (`data-bg="noir"`) com detalhes champanhe. No computador, a rolagem tem inércia suave (Lenis, `smooth-scroll.tsx`), desligada no toque e com "reduzir movimento".
- **Destaques em trilho horizontal**: no computador, a seção fica presa na tela e a rolagem desliza os cartões para o lado (`featured-rail.tsx`). No celular, é um carrossel de arrastar.
