import { test, expect } from '@playwright/test';

/**
 * Bio Dashboard: Folder Logic & Constraint Integrity.
 * Verifies that the 1-level depth limit is enforced and moves/deletes work.
 */
test.describe.serial('Bio: Folder Logic', () => {
  const runId = Date.now();
  const folderName = `Folder Logic ${runId}`;
  const linkName = `Link in Folder ${runId}`;
  const testUrl = 'https://google.com';

  test('folders do not have a "Move" action (Enforcing 1-level limit)', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // 1. Create a folder
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByRole('tab', { name: 'Folder' }).click();
    await page.locator('#title').fill(folderName);
    await page.getByRole('button', { name: 'Add Folder', exact: true }).click();
    
    // Wait for folder to appear
    const folderRow = page.locator('div.group').filter({ hasText: folderName }).first();
    await expect(folderRow).toBeVisible();

    // 2. Verify that folders DO NOT have a move button (because they can't be nested)
    const moveButton = folderRow.getByRole('button', { name: 'Move' });
    await expect(moveButton).not.toBeVisible();
  });

  test('can move a link from root into a folder', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // 1. Create a dummy link at root
    const rootLinkName = `Root Link ${Date.now()}`;
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByLabel(/link title/i).fill(rootLinkName);
    await page.getByLabel(/destination url/i).fill('https://test.com');
    await page.getByRole('button', { name: 'Add Link', exact: true }).click();
    
    // Wait for success toast and modal to close
    await expect(page.getByText(/Link added!/i)).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Link should appear in the list
    const rootLinkLocator = page.locator('div.group').filter({ hasText: rootLinkName }).first();
    await expect(rootLinkLocator).toBeVisible({ timeout: 15000 });

    // 2. Move root link into the folder
    const linkRow = page.locator('div.group').filter({ hasText: rootLinkName }).first();
    await linkRow.getByRole('button', { name: 'Move' }).click();
    
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: folderName }).click();
    await page.getByRole('button', { name: 'Move Link' }).click();

    // Verify success and removal from root
    await expect(page.getByText(/Moved to folder/i)).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(linkRow).not.toBeVisible({ timeout: 10000 });

    // 3. Verify folder count increment
    const folderRow = page.locator('div.group').filter({ hasText: folderName }).first();
    await expect(folderRow.getByText(/1\s*items/i)).toBeVisible();

    // 4. Drill down and verify link is there
    await folderRow.click();
    await expect(page.getByText(rootLinkName)).toBeVisible();
    
    // Cleanup: Go back to root for subsequent tests
    await page.getByRole('button', { name: /Back to main list/i }).click();
  });

  test('can move a link from folder back to root', async ({ page }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // 1. Enter the folder
    await page.locator('div.group').filter({ hasText: folderName }).first().click();
    
    // 2. Add a link inside
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByLabel(/link title/i).fill(linkName);
    await page.getByLabel(/destination url/i).fill(testUrl);
    await page.getByRole('button', { name: 'Add Link', exact: true }).click();
    await expect(page.getByText(linkName)).toBeVisible();

    // 3. Move link back to root
    const linkRow = page.locator('div.group').filter({ hasText: linkName }).first();
    await linkRow.getByRole('button', { name: 'Move' }).click();
    
    // Select "Main List" in the combobox
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /Main List/i }).click();
    await page.getByRole('button', { name: 'Move Link' }).click();

    // Verify success toast/message and wait for modal to close
    await expect(page.getByText(/Moved to main list/i)).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Link should be gone from the folder editor view
    const editorList = page.locator('.min-h-\\[400px\\]');
    const linkInFolderRow = editorList.locator('div.group').filter({ hasText: linkName });
    await expect(linkInFolderRow).not.toBeVisible({ timeout: 10000 });

    // 4. Return to root and verify link is there
    await page.getByRole('button', { name: /Back to main list/i }).click();
    
    // We check existence in the whole page first to account for Phone Preview and Editor
    await expect(page.getByText(linkName).first()).toBeVisible({ timeout: 10000 });
    
    // Confirm it's specifically in the editor list now
    await expect(editorList.getByText(linkName)).toBeVisible();
  });

  test('cascade delete: link is removed when its folder is deleted', async ({ page, browser }) => {
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // 1. Move the link back INTO the folder for the cascade test
    const linkRow = page.locator('div.group').filter({ hasText: linkName }).first();
    await linkRow.getByRole('button', { name: 'Move' }).click();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: folderName }).click();
    await page.getByRole('button', { name: 'Move Link' }).click();
    await expect(linkRow).not.toBeVisible();

    // 2. Delete the folder
    const folderRow = page.locator('div.group').filter({ hasText: folderName }).first();
    await folderRow.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(folderRow).not.toBeVisible();

    // 3. Verification: Check public profile to ensure link is GONE
    const username = 'azmischutze';
    const guestContext = await browser.newContext({ storageState: undefined });
    const guestPage = await guestContext.newPage();
    await guestPage.goto(`/${username}`);
    
    // Folder should be gone
    await expect(guestPage.getByText(folderName)).not.toBeVisible();
    // Link should be gone (Cascade check)
    await expect(guestPage.getByText(linkName)).not.toBeVisible();
    
    await guestContext.close();
  });
});
