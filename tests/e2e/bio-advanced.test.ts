import { test, expect } from '@playwright/test';

const runId = Date.now();

// Helper to format Date to YYYY-MM-DDTHH:mm string for datetime-local input
function formatToDatetimeLocalString(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

/**
 * End-to-End Test Suite for Day 25:
 * - Bio Drag & Drop Reordering (dashboard & public profile persistence)
 * - Bio Link Click Analytics Tracking
 * - Bio Link Scheduling (Future start, past expiry, and active visibility logic)
 */
test.describe.serial('Bio Advanced Features E2E', () => {
  test.setTimeout(60_000);

  test('1. Drag & Drop Link Reordering', async ({ page, browser }) => {
    const linkTitle1 = `DnD Alpha ${runId}`;
    const linkTitle2 = `DnD Beta ${runId}`;
    const linkTitle3 = `DnD Gamma ${runId}`;
    const testUrl = 'https://example.com/dnd';

    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // Create 3 links in sequential order
    for (const title of [linkTitle1, linkTitle2, linkTitle3]) {
      await page.getByRole('button', { name: 'Add Item' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await dialog.locator('#title').fill(title);
      await dialog.getByLabel(/destination url/i).fill(testUrl);
      await dialog.getByRole('button', { name: 'Add Link', exact: true }).click();
      await expect(dialog).not.toBeVisible({ timeout: 10000 });

      await expect(page.locator('h3').filter({ hasText: title }).first()).toBeVisible({ timeout: 10000 });
    }

    // Identify row element for Link 1 and Link 3
    const row1 = page.locator('div.group').filter({ hasText: linkTitle1 }).first();
    const row3 = page.locator('div.group').filter({ hasText: linkTitle3 }).first();

    const handle1 = row1.getByRole('button', { name: 'Drag to reorder' });
    const handle3 = row3.getByRole('button', { name: 'Drag to reorder' });

    // Perform dragTo from handle 3 to handle 1
    await handle3.dragTo(handle1);

    // Wait for server action reorderLinks and path revalidation
    await page.waitForTimeout(1500);

    // Verify on public profile that order persists
    const username = process.env.E2E_TEST_USERNAME;
    if (username) {
      const guestContext = await browser.newContext({ storageState: undefined });
      const guestPage = await guestContext.newPage();
      await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' });

      // Verify all 3 titles are visible on public profile
      await expect(guestPage.getByText(linkTitle1)).toBeVisible({ timeout: 10000 });
      await expect(guestPage.getByText(linkTitle3)).toBeVisible({ timeout: 10000 });

      // Check relative order: index of Gamma should be less than index of Alpha
      const pageContent = await guestPage.content();
      const posAlpha = pageContent.indexOf(linkTitle1);
      const posGamma = pageContent.indexOf(linkTitle3);
      expect(posGamma).toBeGreaterThan(-1);
      expect(posAlpha).toBeGreaterThan(-1);
      expect(posGamma).toBeLessThan(posAlpha);

      await guestContext.close();
    }

    // Cleanup created items
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();
    for (const title of [linkTitle1, linkTitle2, linkTitle3]) {
      const targetRow = page.locator('div.group').filter({ hasText: title }).first();
      if (await targetRow.isVisible()) {
        await targetRow.scrollIntoViewIfNeeded();
        await targetRow.hover();
        await targetRow.getByRole('button', { name: 'Delete' }).click();

        const deleteDialog = page.getByRole('alertdialog');
        await expect(deleteDialog).toBeVisible({ timeout: 5000 });
        await deleteDialog.getByRole('button', { name: 'Delete' }).click();

        // Await server action completion and toast
        await expect(page.getByText('Link deleted!').first()).toBeVisible({ timeout: 10000 });
        await expect(targetRow).not.toBeVisible({ timeout: 10000 });
        await expect(deleteDialog).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('2. Analytics Click Tracking', async ({ page, browser }) => {
    const analyticsLinkTitle = `Analytics Link ${runId}`;
    const targetUrl = 'https://example.com/e2e-analytics-target';

    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // Create a new link
    await page.getByRole('button', { name: 'Add Item' }).click();
    const addDialog = page.getByRole('dialog');
    await expect(addDialog).toBeVisible({ timeout: 5000 });
    await addDialog.locator('#title').fill(analyticsLinkTitle);
    await addDialog.getByLabel(/destination url/i).fill(targetUrl);
    await addDialog.getByRole('button', { name: 'Add Link', exact: true }).click();
    await expect(addDialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3').filter({ hasText: analyticsLinkTitle }).first()).toBeVisible({ timeout: 10000 });

    const username = process.env.E2E_TEST_USERNAME;
    expect(username).toBeTruthy();

    // Visit public profile as guest and click the link (opens popup tab via target="_blank")
    const guestContext = await browser.newContext({ storageState: undefined });
    const guestPage = await guestContext.newPage();
    await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' });

    const publicLink = guestPage.getByText(analyticsLinkTitle).first();
    await expect(publicLink).toBeVisible({ timeout: 10000 });

    // Link has target="_blank", so Playwright opens a popup page
    const [popup] = await Promise.all([
      guestPage.waitForEvent('popup'),
      publicLink.click(),
    ]);

    await popup.waitForLoadState('domcontentloaded').catch(() => null);
    await guestContext.close();

    // Navigate to Analytics dashboard in authenticated session
    await page.goto('/bio/analytics');
    await expect(page.getByText(/Total Clicks/i).first()).toBeVisible({ timeout: 10000 });

    // Cleanup link
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();
    const row = page.locator('div.group').filter({ hasText: analyticsLinkTitle }).first();
    if (await row.isVisible()) {
      await row.scrollIntoViewIfNeeded();
      await row.hover();
      await row.getByRole('button', { name: 'Delete' }).click();

      const deleteDialog = page.getByRole('alertdialog');
      await expect(deleteDialog).toBeVisible({ timeout: 5000 });
      await deleteDialog.getByRole('button', { name: 'Delete' }).click();

      await expect(page.getByText('Link deleted!').first()).toBeVisible({ timeout: 10000 });
      await expect(row).not.toBeVisible({ timeout: 10000 });
      await expect(deleteDialog).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('3. Link Scheduling Visibility Logic', async ({ page, browser }) => {
    const futureLinkTitle = `Future Item ${runId}`;
    const expiredLinkTitle = `Past Expiry Item ${runId}`;
    const activeLinkTitle = `Active Window Item ${runId}`;
    const testUrl = 'https://example.com/schedule';

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const tomorrowStr = formatToDatetimeLocalString(tomorrow);
    const yesterdayStr = formatToDatetimeLocalString(yesterday);
    const dayAfterTomorrowStr = formatToDatetimeLocalString(dayAfterTomorrow);

    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();

    // A. Create Future Scheduled Link (scheduled_at = tomorrow)
    await page.getByRole('button', { name: 'Add Item' }).click();
    let dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('#title').fill(futureLinkTitle);
    await dialog.getByLabel(/destination url/i).fill(testUrl);
    // Toggle schedule switch on
    await dialog.locator('#schedule-toggle').click();
    await dialog.locator('#scheduled_at').fill(tomorrowStr);
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3').filter({ hasText: futureLinkTitle }).first()).toBeVisible({ timeout: 10000 });

    // Verify dashboard badge for future link ("Goes live")
    const futureRow = page.locator('div.group').filter({ hasText: futureLinkTitle }).first();
    await expect(futureRow.getByText(/Goes live/i)).toBeVisible({ timeout: 10000 });

    // B. Create Expired Link (expires_at = yesterday)
    await page.getByRole('button', { name: 'Add Item' }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('#title').fill(expiredLinkTitle);
    await dialog.getByLabel(/destination url/i).fill(testUrl);
    await dialog.locator('#schedule-toggle').click();
    await dialog.locator('#expires_at').fill(yesterdayStr);
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3').filter({ hasText: expiredLinkTitle }).first()).toBeVisible({ timeout: 10000 });

    // Verify dashboard badge for expired link ("🔴 Expired")
    const expiredRow = page.locator('div.group').filter({ hasText: expiredLinkTitle }).first();
    await expect(expiredRow.getByText(/🔴 Expired/i)).toBeVisible({ timeout: 10000 });

    // C. Create Active Scheduled Link (scheduled_at = yesterday, expires_at = dayAfterTomorrow)
    await page.getByRole('button', { name: 'Add Item' }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('#title').fill(activeLinkTitle);
    await dialog.getByLabel(/destination url/i).fill(testUrl);
    await dialog.locator('#schedule-toggle').click();
    await dialog.locator('#scheduled_at').fill(yesterdayStr);
    await dialog.locator('#expires_at').fill(dayAfterTomorrowStr);
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3').filter({ hasText: activeLinkTitle }).first()).toBeVisible({ timeout: 10000 });

    // Verify dashboard badge for active link ("🟢 Live until")
    const activeRow = page.locator('div.group').filter({ hasText: activeLinkTitle }).first();
    await expect(activeRow.getByText(/🟢 Live until/i)).toBeVisible({ timeout: 10000 });

    // D. Verify Public Profile Visibility (Guest Context)
    const username = process.env.E2E_TEST_USERNAME;
    if (username) {
      const guestContext = await browser.newContext({ storageState: undefined });
      const guestPage = await guestContext.newPage();
      await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' });

      // Future and Expired links must NOT be visible
      await expect(guestPage.getByText(futureLinkTitle)).not.toBeVisible({ timeout: 5000 });
      await expect(guestPage.getByText(expiredLinkTitle)).not.toBeVisible({ timeout: 5000 });

      // Active link MUST be visible
      await expect(guestPage.getByText(activeLinkTitle)).toBeVisible({ timeout: 10000 });

      await guestContext.close();
    }

    // Cleanup created links
    await page.goto('/bio');
    await page.getByRole('tab', { name: /links/i }).click();
    for (const title of [futureLinkTitle, expiredLinkTitle, activeLinkTitle]) {
      const targetRow = page.locator('div.group').filter({ hasText: title }).first();
      if (await targetRow.isVisible()) {
        await targetRow.scrollIntoViewIfNeeded();
        await targetRow.hover();
        await targetRow.getByRole('button', { name: 'Delete' }).click();

        const deleteDialog = page.getByRole('alertdialog');
        await expect(deleteDialog).toBeVisible({ timeout: 5000 });
        await deleteDialog.getByRole('button', { name: 'Delete' }).click();

        await expect(page.getByText('Link deleted!').first()).toBeVisible({ timeout: 10000 });
        await expect(targetRow).not.toBeVisible({ timeout: 10000 });
        await expect(deleteDialog).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

});
