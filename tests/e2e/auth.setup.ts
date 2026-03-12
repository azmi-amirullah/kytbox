import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * One-time auth setup. Logs in and saves the session state to a file.
 * All E2E tests that depend on the 'setup' project will reuse this state.
 *
 * Requires env vars:
 *   E2E_TEST_EMAIL
 *   E2E_TEST_PASSWORD
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set in environment variables');
  }

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to the platform dashboard
  await page.waitForURL('**/app', { timeout: 10_000 });
  await expect(page).toHaveURL(/\/app/);

  // Save session (cookies + localStorage) for reuse
  await page.context().storageState({ path: authFile });
});
