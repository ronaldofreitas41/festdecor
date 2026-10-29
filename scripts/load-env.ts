// Carrega o .env local nos scripts de linha de comando (o Next.js faz isso sozinho).
try {
  process.loadEnvFile(".env");
} catch {
  // Sem .env: as variáveis vêm do ambiente (CI, servidor de produção).
}
