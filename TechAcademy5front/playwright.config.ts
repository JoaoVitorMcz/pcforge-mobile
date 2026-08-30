import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  // O reporter padrao ('dot' no CI, 'list' fora) nao gera playwright-report/.
  // Sem o reporter html o artifact publicado pelo CI vem vazio.
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    // A primeira compilacao do CRA com o cache do webpack frio (logo apos
    // npm install/npm ci, que e sempre o caso no CI) passa de 5 minutos.
    // Com cache quente a subida leva ~20s.
    timeout: 600000,
    env: {
      BROWSER: 'none',
      DANGEROUSLY_DISABLE_HOST_CHECK: 'true',
      PORT: '3001',
    },
  },
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
