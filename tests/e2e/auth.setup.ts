import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

/**
 * One-time auth setup. Logs in and saves the session state to a file.
 * All E2E tests that depend on the 'setup' project will reuse this state,
 * avoiding a login on every test run.
 *
 * Requires env vars:
 *   E2E_TEST_EMAIL
 *   E2E_TEST_PASSWORD
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set in .env.local');
  }

  await page.goto('/login');

  // The login form uses id-based inputs, no <label> elements
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  // Button text is 'Sign In' when idle (changes to 'Signing in...' when loading)
  // Use exact: true to avoid conflicting with 'Sign in with Google'
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  // Wait for redirect to the dashboard after successful login
  await page.waitForURL('**/app', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/app/);

  // Persist session (cookies + localStorage) for all subsequent tests
  await page.context().storageState({ path: authFile });
});
