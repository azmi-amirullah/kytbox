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

    // Fill in the form
    await page.getByLabel(/link title/i).fill(testLinkTitle);
    await page.getByLabel(/destination url/i).fill(testUrl);
    await page.getByRole('button', { name: 'Add Link', exact: true }).click();

    // Verify visibility
    await expect(page.locator('h3').filter({ hasText: testLinkTitle }).first()).toBeVisible({ timeout: 10000 });
  });

  test('can edit a link', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    const targetRow = page.locator('div.group').filter({ hasText: testLinkTitle }).first();
    await targetRow.getByRole('button', { name: 'Edit' }).click();

    const updatedTitle = `${testLinkTitle} (Edited)`;
    await page.getByLabel(/link title/i).fill(updatedTitle);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.locator('h3').filter({ hasText: updatedTitle }).first()).toBeVisible({ timeout: 10000 });
  });

  test('can create a folder', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByRole('tab', { name: 'Folder' }).click();
    await page.locator('#title').fill(testFolderTitle);
    await page.getByRole('button', { name: 'Add Folder', exact: true }).click();

    await expect(page.locator('h3').filter({ hasText: testFolderTitle }).first()).toBeVisible({ timeout: 10000 });
  });

  test('can move a link into a folder', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    const updatedTitle = `${testLinkTitle} (Edited)`;
    const linkRow = page.locator('div.group').filter({ hasText: updatedTitle }).first();
    
    // Open Move modal
    await linkRow.getByRole('button', { name: 'Move' }).click();
    
    // Select the folder
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: testFolderTitle }).click();
    await page.getByRole('button', { name: 'Move Link' }).click();

    // Verification: The link should no longer be in the main list
    await expect(linkRow).not.toBeVisible({ timeout: 10000 });

    // Drill down into folder to verify it's there
    await page.locator('div.group').filter({ hasText: testFolderTitle }).first().click();
    await expect(page.locator('h3').filter({ hasText: testLinkTitle }).first()).toBeVisible({ timeout: 10000 });
  });

  test('renders the public profile with the newly created items', async ({ browser }) => {
    const username = process.env.E2E_TEST_USERNAME;
    if (!username) throw new Error('E2E_TEST_USERNAME must be set');

    const guestContext = await browser.newContext({ storageState: undefined });
    const guestPage = await guestContext.newPage();
    await guestPage.goto(`/${username}`);

    await expect(guestPage.getByText('Powered by').first()).toBeVisible();
    
    // The link is inside a folder now, so we click the folder on the public page
    await guestPage.getByText(testFolderTitle).click();
    await expect(guestPage.getByText(testLinkTitle)).toBeVisible({ timeout: 10000 });

    await guestContext.close();
  });

  test('cleans up test data', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // If we are deep in a folder from a previous test, we need to be at root
    // But since each test starts with page.goto('/bio'), we are at root.

    // 1. Delete the folder (this should delete contents too in ukit's logic)
    const folderRow = page.locator('div.group').filter({ hasText: testFolderTitle }).first();
    if (await folderRow.isVisible()) {
      await folderRow.getByRole('button', { name: 'Delete' }).click();
      // AlertDialog handle
      await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
      await expect(folderRow).not.toBeVisible({ timeout: 10000 });
    }

    // 2. Just in case, try to delete the link if it's still at root (cleanup isolation)
    const linkRow = page.locator('div.group').filter({ hasText: testLinkTitle }).first();
    if (await linkRow.isVisible()) {
      await linkRow.getByRole('button', { name: 'Delete' }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
      await expect(linkRow).not.toBeVisible({ timeout: 10000 });
    }
  });

  test('can toggle a link active/inactive', async ({ page }) => {
    // We already have a unique item we just deleted. 
    // Let's run toggle on a fresh link so we don't mess up existing data.
    const toggleLinkName = `Toggle Test ${runId}`;
    
    await page.goto('/bio');
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByLabel(/link title/i).fill(toggleLinkName);
    await page.getByLabel(/destination url/i).fill(testUrl);
    await page.getByRole('button', { name: 'Add Link', exact: true }).click();

    const row = page.locator('div.group').filter({ hasText: toggleLinkName }).first();
    const toggle = row.getByRole('switch');
    const initialState = await toggle.getAttribute('aria-checked') ?? 'true';
    
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', initialState === 'true' ? 'false' : 'true', { timeout: 10000 });

    // Cleanup toggle test
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  });

});
