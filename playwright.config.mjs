// Config Playwright — smoke E2E (Onda 12 · backlog #98 parcial).
// Sobe o servidor estático local e roda tests/e2e/ no Chromium.
import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Ambientes de agente têm Chromium pré-instalado num caminho fixo
// (evita download); no CI o passo `playwright install` provê o dele.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    ...(existsSync(PREINSTALLED_CHROMIUM) && !process.env.CI
      ? { launchOptions: { executablePath: PREINSTALLED_CHROMIUM } }
      : {}),
  },
  webServer: {
    command: 'node scripts/serve.mjs 4173',
    url: 'http://localhost:4173/robots.txt',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
