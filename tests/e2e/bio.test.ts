import { test, expect } from '@playwright/test';

// Use a unique ID for this test run so we can identify our created items
const runId = Date.now();
const testLinkTitle = `E2E Link ${runId}`;
const testFolderTitle = `E2E Folder ${runId}`;
const testUrl = 'https://example.com/e2e';

/**
 * Critical path: Bio dashboard link management.
 * We use .serial so the tests run strictly in order: Create -> Verify Public -> Cleanup.
 * This prevents data duplication and checks true end-to-end propagation.
 */
test.describe.serial('Bio E2E Flow', () => {
  
  // We don't use beforeEach because the public profile test needs a fresh unauthenticated context
  // Instead, we navigate to the bio dashboard explicitly in the logged-in tests.
  
  test('can add a new link', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // Open the add link modal
    await page.getByRole('button', { name: 'Add Item' }).click();

    // Fill in the form (defaults to Link tab)
    await page.getByLabel(/link title/i).fill(testLinkTitle);
    await page.getByLabel(/destination url/i).fill(testUrl);
    await page.getByRole('button', { name: 'Add Link', exact: true }).click();

    // The link should appear in the list (look for the exact heading)
    await expect(page.locator('h3').filter({ hasText: testLinkTitle }).first()).toBeVisible({ timeout: 10000 });
  });

  test('can toggle a link active/inactive', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // Wait for the specific tested link's row
    const targetRow = page.locator('div.group').filter({ hasText: testLinkTitle }).first();
    await expect(targetRow).toBeVisible({ timeout: 10000 });
    
    // Find its toggle
    const toggle = targetRow.getByRole('switch');
    const initialState = await toggle.getAttribute('aria-checked') ?? 'true';
    
    // Deactivate it
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', initialState === 'true' ? 'false' : 'true', { timeout: 10000 });
    
    // Reactivate it so it shows up on the public profile for our subsequent tests
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', initialState, { timeout: 10000 });
  });

  test('can create a folder', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // Open the add item modal
    await page.getByRole('button', { name: 'Add Item' }).click();

    // Switch to Folder tab
    await page.getByRole('tab', { name: 'Folder' }).click();

    // Fill in folder name - use locator for precision since labels change
    await page.locator('#title').fill(testFolderTitle);
    
    // Submit
    await page.getByRole('button', { name: 'Add Folder', exact: true }).click();

    // It should appear in the list
    await expect(page.locator('h3').filter({ hasText: testFolderTitle }).first()).toBeVisible({ timeout: 10000 });
  });

  test('renders the public profile with the newly created items', async ({ browser }) => {
    const username = process.env.E2E_TEST_USERNAME;
    if (!username) {
      throw new Error('E2E_TEST_USERNAME must be set in .env.local');
    }

    // Open a fresh unauthenticated context — no stored cookies or session, perfectly simulating a guest
    const guestContext = await browser.newContext({ storageState: undefined });
    const guestPage = await guestContext.newPage();

    await guestPage.goto(`/${username}`);

    // Public profile must render without redirecting to login
    await expect(guestPage).not.toHaveURL(/login/);
    
    // Verify the base page loaded
    await expect(guestPage.getByText('Powered by').first()).toBeVisible();

    // Verify our specific link and folder made it to the public facing profile
    await expect(guestPage.getByText(testLinkTitle)).toBeVisible({ timeout: 10000 });
    await expect(guestPage.getByText(testFolderTitle)).toBeVisible({ timeout: 10000 });

    await guestContext.close();
  });

  test('cleans up test data', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // Delete the test link
    const linkRow = page.locator('div.group').filter({ hasText: testLinkTitle }).first();
    if (await linkRow.isVisible()) {
      await linkRow.getByRole('button', { name: 'Delete' }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
      await expect(linkRow).not.toBeVisible({ timeout: 10000 });
    }

    // Delete the test folder
    const folderRow = page.locator('div.group').filter({ hasText: testFolderTitle }).first();
    if (await folderRow.isVisible()) {
      await folderRow.getByRole('button', { name: 'Delete' }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
      await expect(folderRow).not.toBeVisible({ timeout: 10000 });
    }
  });

});
