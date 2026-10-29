import { defineConfig, devices } from "@playwright/test";

// Roda contra o build de produção: `npm run build` antes, banco com migrações e
// uma administradora (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD).
const PORT = Number(process.env.E2E_PORT ?? 3217);
const channel = process.env.E2E_BROWSER_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], channel } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
