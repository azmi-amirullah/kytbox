import { test, expect } from '@playwright/test';

/**
 * Security: Route Protection.
 * Verifies that protected routes are shielded from unauthenticated users
 * and properly redirect to the login page.
 */
test.describe('Security: Route Protection', () => {
  // Use an empty storage state to simulate an unauthenticated user
  test.use({ storageState: { cookies: [], origins: [] } });

  const protectedPaths = [
    '/bio',
    '/app',
    '/settings',
    '/support',
    '/support-admin',
    '/update-password',
    '/onboarding',
    '/cashflow', // Exact match protection
  ];

  for (const path of protectedPaths) {
    test(`unauthenticated user is redirected to /login from ${path}`, async ({ page }) => {
      // We use page.goto and wait for the URL to change
      await page.goto(path);
      
      // Verification: The URL should now include /login
      // We check for /login because it might have query params like ?next=/bio
      await expect(page).toHaveURL(/.*\/login.*/);
    });
  }

  test('public cashflow detail view is accessible without login', async ({ page }) => {
    const cashflowId = '94b866ab-6a86-49ad-a14b-22cbc7574405';
    const path = `/cashflow/${cashflowId}`;
    
    await page.goto(path);
    
    // It should NOT be at login
    await expect(page).not.toHaveURL(/.*\/login.*/);
    
    // It should NOT be a 404 page
    await expect(page.getByText(/404|not found/i)).not.toBeVisible();
    
    // Verification: It should render the cashflow summary labels
    // We use a longer timeout and check for multiple elements to be sure
    await expect(page.getByText('Income', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Balance', { exact: true }).first()).toBeVisible();
  });
  
  test('public profile view is accessible without login', async ({ page }) => {
    const username = 'azmischutze';
    const path = `/${username}`;
    await page.goto(path);
    
    // It should NOT be at login
    await expect(page).not.toHaveURL(/.*\/login.*/);
    
    // It should NOT be a 404 page
    await expect(page.getByText(/404|not found/i)).not.toBeVisible();

    // Profile should show the username or "Powered by"
    await expect(page.getByText(username, { exact: false }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Powered by').first()).toBeVisible();
  });
});

test.describe('Security: Authenticated Redirection', () => {
  // This test uses the default authenticated state from setup
  
  test('authenticated user is redirected from /login to /app', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*\/app/);
  });

  test('authenticated user is redirected from /signup to /app', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/.*\/app/);
  });
});
