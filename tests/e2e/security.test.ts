import { test, expect } from '@playwright/test';

/**
 * Security: Route Protection & Public Access.
 * Verifies that protected routes are shielded from unauthenticated users
 * and properly redirect to the login page.
 */
test.describe('Security: Route Protection', () => {
  const protectedPaths = [
    '/bio',
    '/app',
    '/settings',
    '/support',
    '/support-admin',
    '/update-password',
    '/onboarding',
    '/cashflow',
    '/cashflow/goal/00000000-0000-0000-0000-000000000000',
  ];

  for (const path of protectedPaths) {
    test(`unauthenticated user is redirected to /login from ${path}`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
      const page = await context.newPage();

      await page.goto(path);
      await expect(page).toHaveURL(/.*\/login.*/);

      await context.close();
    });
  }

  test('public profile view is accessible without login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    await page.goto('/azmischutze');
    await expect(page).not.toHaveURL(/.*\/login.*/);

    await context.close();
  });
});

test.describe('Security: Authenticated Redirection', () => {
  test('authenticated user is redirected from /login to /app', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*\/app/);
  });

  test('authenticated user is redirected from /signup to /app', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/.*\/app/);
  });
});
