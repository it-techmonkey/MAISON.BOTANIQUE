import { defineConfig, devices } from '@playwright/test';

// Buying-flow smoke tests (tests/e2e). They run against a deployed site:
//   E2E_BASE_URL=https://<vercel-preview> npx playwright test
// Without E2E_BASE_URL they start the local production build (`npm run build` first).
// E2E_EXPECT_LIVE=1 makes the Shopify checkout and WhatsApp tests fail, instead of
// noting a gap, when the site is not connected to Shopify (used by the hourly live check).
const baseURL = process.env.E2E_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:3000';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }], ['github']] : [['list']],
  use: {
    baseURL,
    locale: 'en-GB',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run start',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
