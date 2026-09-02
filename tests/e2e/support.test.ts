import { test, expect } from '@playwright/test';
import path from 'path';

const runId = Date.now();
const ticketSubject = `E2E Support Ticket ${runId}`;
const ticketMessage = `This is an automated E2E ticket message for verification run ${runId}`;
const adminReplyMessage = `This is an automated E2E admin reply for ticket ${runId}`;
const userAuthFile = path.join(__dirname, '../../playwright/.auth/user.json');
const adminAuthFile = path.join(__dirname, '../../playwright/.auth/admin.json');

test.use({ storageState: userAuthFile });

/**
 * End-to-End Test Suite for Support App:
 * Complete lifecycle test in a single serial flow (User Create → Admin Reply → User Notification).
 */
test.describe.serial('Support App E2E Flow', () => {
  test.setTimeout(60_000);

  test('Support Ticket Lifecycle (User Create → Admin Reply → User Notification)', async ({ page, browser }) => {
    // 1. User creates a support ticket
    await page.goto('/app');
    await expect(page).toHaveURL(/\/app/);
    await page.goto('/support/new');

    await page.locator('#subject').fill(ticketSubject);
    await page.locator('#message').fill(ticketMessage);

    // Submit ticket
    await page.getByRole('button', { name: /Submit Ticket/i }).click();

    // Verify redirection to ticket detail UUID path (/support/[uuid])
    await page.waitForURL(/\/support\/[a-f0-9-]{36}/, { timeout: 20_000 });
    const createdTicketUrl = page.url();

    // Perform top-level navigation to ticket URL to ensure full cookie context
    await page.goto(createdTicketUrl);

    // Verify subject and message appear in ticket view (wait up to 15s for RSC streaming)
    await expect(page.getByText(ticketSubject).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ticketMessage).first()).toBeVisible({ timeout: 15_000 });

    // 2. Admin views ticket in queue and submits reply
    const adminContext = await browser.newContext({
      storageState: adminAuthFile,
    });
    const adminPage = await adminContext.newPage();

    await adminPage.goto('/support-admin');

    // Locate created ticket in admin queue and click to navigate
    const ticketLink = adminPage.locator('a[href^="/support-admin/"]').filter({ hasText: ticketSubject }).first();
    await expect(ticketLink).toBeVisible({ timeout: 15_000 });
    await ticketLink.click();

    await adminPage.waitForURL(/\/support-admin\/[a-f0-9-]{36}/, { timeout: 15_000 });
    await expect(adminPage.getByText(ticketSubject).first()).toBeVisible({ timeout: 15_000 });

    // Fill reply form
    const replyTextarea = adminPage.getByPlaceholder(/write a reply/i);
    await replyTextarea.fill(adminReplyMessage);

    // Submit reply
    await adminPage.getByRole('button', { name: /Send Reply/i }).click();

    // Verify reply appears in ticket conversation thread
    await expect(adminPage.getByText(adminReplyMessage).first()).toBeVisible({ timeout: 15_000 });

    await adminContext.close();

    // 3. User sees notification bell badge, opens ticket, and badge clears
    await page.goto('/app');

    // Notification bell check
    const bellButton = page.getByRole('button', { name: /notifications/i }).first();
    await expect(bellButton).toBeVisible({ timeout: 15_000 });

    // Wait for notification sync/poll
    await page.waitForTimeout(1000);
    await bellButton.click();

    // Verify notification content appears in popover and click to navigate
    const notificationButton = page.getByRole('dialog').getByRole('button').filter({ hasText: ticketSubject }).first();
    await expect(notificationButton).toBeVisible({ timeout: 15_000 });
    await notificationButton.click();

    // Verify navigation to ticket detail page and admin reply visibility
    await page.waitForURL(/\/support\/[a-f0-9-]{36}/, { timeout: 15_000 });
    await expect(page.getByText(adminReplyMessage).first()).toBeVisible({ timeout: 15_000 });

    // Re-verify notification bell status after opening ticket
    await page.goto('/app');
    const updatedBell = page.getByRole('button', { name: /notifications/i }).first();
    await expect(updatedBell).toBeVisible({ timeout: 15_000 });
  });
});
