import { test, expect } from '@playwright/test';

/**
 * Critical path: Bio dashboard link management.
 * These tests cover the most user-visible mutations - the ones that,
 * if broken, would make the product unusable.
 */
test.describe('Bio Dashboard — Link Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bio');
    // Ensure the Links tab is active
    await page.getByRole('tab', { name: /links/i }).click();
  });

  test('can add a new link', async ({ page }) => {
    const testTitle = `Test Link ${Date.now()}`;
    const testUrl = 'https://example.com';

    // Open the add link form
    await page.getByRole('button', { name: /add link/i }).click();

    // Fill in the form
    await page.getByLabel(/title/i).fill(testTitle);
    await page.getByLabel(/url/i).fill(testUrl);
    await page.getByRole('button', { name: /^add$/i }).click();

    // The link should appear in the list
    await expect(page.getByText(testTitle)).toBeVisible({ timeout: 5000 });
  });

  test('can toggle a link active/inactive', async ({ page }) => {
    // Find the first toggle switch in the link list
    const firstToggle = page.getByRole('switch').first();
    const initialState = await firstToggle.getAttribute('aria-checked');

    await firstToggle.click();

    // State should have flipped
    const newState = initialState === 'true' ? 'false' : 'true';
    await expect(firstToggle).toHaveAttribute('aria-checked', newState, { timeout: 5000 });
  });

  test('can create a folder', async ({ page }) => {
    const folderName = `Test Folder ${Date.now()}`;

    await page.getByRole('button', { name: /add folder/i }).click();
    await page.getByLabel(/folder name/i).fill(folderName);
    await page.getByRole('button', { name: /^create$/i }).click();

    await expect(page.getByText(folderName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Public Profile Page', () => {
  test('renders a public profile without authentication', async ({ page, context }) => {
    // Clear auth state to test as a guest
    await context.clearCookies();

    const username = process.env.E2E_TEST_USERNAME ?? 'testuser';
    await page.goto(`/${username}`);

    // The profile page should render without redirect
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('main')).toBeVisible();
  });
});
