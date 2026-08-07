import { test, expect } from '@playwright/test';

/**
 * End-to-End Visual Regression Test Suite (Day 28 Baseline).
 * Captures screenshot baselines of key public and platform surfaces to prevent CSS regressions.
 */
test.describe('Visual Regression Baselines', () => {

  test('1. Public profile — light theme', async ({ browser }) => {
    const username = process.env.E2E_TEST_USERNAME;
    expect(username).toBeTruthy();

    const guestContext = await browser.newContext({
      colorScheme: 'light',
      storageState: undefined,
    });
    const page = await guestContext.newPage();
    await page.goto(`/${username}`);

    await expect(page.getByText('Powered by').first()).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot('public-profile-light.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });

    await guestContext.close();
  });

  test('2. Public profile — dark theme', async ({ browser }) => {
    const username = process.env.E2E_TEST_USERNAME;
    expect(username).toBeTruthy();

    const guestContext = await browser.newContext({
      colorScheme: 'dark',
      storageState: undefined,
    });
    const page = await guestContext.newPage();
    await page.goto(`/${username}`);

    await expect(page.getByText('Powered by').first()).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot('public-profile-dark.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });

    await guestContext.close();
  });

  test('3. Bio dashboard — links tab', async ({ page }) => {
    await page.goto('/bio');
    const linksTab = page.getByRole('tab', { name: /links/i });
    if (await linksTab.isVisible()) {
      await linksTab.click();
    }
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('bio-dashboard-links.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('4. Bio dashboard — appearance tab', async ({ page }) => {
    await page.goto('/bio');
    const appearanceTab = page.getByRole('tab', { name: /appearance/i });
    await expect(appearanceTab).toBeVisible({ timeout: 10_000 });
    await appearanceTab.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('bio-dashboard-appearance.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('5. Bio analytics page', async ({ page }) => {
    await page.goto('/bio/analytics');
    await expect(page.getByText(/Total Clicks/i).first()).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('bio-analytics.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('6. Cashflow dashboard', async ({ page }) => {
    await page.goto('/cashflow');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('cashflow-dashboard.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('7. Cashflow detail page', async ({ page }) => {
    await page.goto('/cashflow');
    const cashflowLink = page.getByRole('link', { name: /Cashflow|Budget|Book/i }).first();
    
    if (await cashflowLink.isVisible()) {
      await cashflowLink.click();
      await page.waitForURL(/\/cashflow\/[a-f0-9-]{36}/, { timeout: 15_000 });
    } else {
      // Create a temporary cashflow if none exists
      const runId = Date.now();
      const title = `Visual Cashflow ${runId}`;
      await page.getByRole('button', { name: /New Cashflow/i }).first().click();
      await page.locator('#title').fill(title);
      await page.getByRole('dialog').getByRole('button', { name: /Create|Save/i }).click();
      const createdLink = page.getByRole('link', { name: title }).first();
      await expect(createdLink).toBeVisible({ timeout: 10_000 });
      await createdLink.click();
      await page.waitForURL(/\/cashflow\/[a-f0-9-]{36}/, { timeout: 15_000 });
    }

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('cashflow-detail.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('8. List hub', async ({ page }) => {
    await page.goto('/list');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('list-hub.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('9. Todo board (Kanban)', async ({ page }) => {
    await page.goto('/list/todo');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('todo-board.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('10. Wishlist view', async ({ page }) => {
    await page.goto('/list/wishlist');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('wishlist-view.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('11. Ideas view', async ({ page }) => {
    await page.goto('/list/ideas');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('ideas-view.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('12. Landing page — above fold', async ({ browser, baseURL }) => {
    const guestContext = await browser.newContext({ storageState: undefined });
    const page = await guestContext.newPage();
    // Landing page lives on apex domain (http://localhost:3000), whereas platform baseURL is app.localhost:3000
    const landingUrl = baseURL ? baseURL.replace('//app.', '//') : 'http://localhost:3000/';
    await page.goto(landingUrl);

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing-page.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });

    await guestContext.close();
  });

});
