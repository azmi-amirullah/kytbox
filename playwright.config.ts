import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Playwright does not natively load .env.local, we need to manually load it.
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Locally: use dev server (no build required).
// In CI or when you want to test the production build:
//   set USE_BUILD_SERVER=1 before running tests.
const useBuildServer = !!process.env.USE_BUILD_SERVER || !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: useBuildServer ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // Dev server takes longer to cold-start
    timeout: useBuildServer ? 30_000 : 120_000,
  },
});
