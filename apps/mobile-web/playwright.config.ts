import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const apiDir = path.join(__dirname, '../api');

export default defineConfig({
  testDir: './e2e/web',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8081',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Prefer env vars over --env-file so CI works without a checked-in .env.
      command: 'pnpm exec tsx src/index.ts',
      cwd: apiDir,
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL ??
          'postgresql://postgres:postgres@localhost:5432/app?schema=public',
        PORT: process.env.PORT ?? '4000',
      },
    },
    {
      command: 'pnpm dev:web',
      url: 'http://localhost:8081',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
