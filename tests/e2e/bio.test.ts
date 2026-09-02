import { test, expect } from '@playwright/test'

const runId = Date.now()
const testLinkTitle = `E2E Link ${runId}`
const testFolderTitle = `E2E Folder ${runId}`
const testUrl = 'https://example.com/e2e'

// Helper to format Date to YYYY-MM-DDTHH:mm string for datetime-local input
function formatToDatetimeLocalString(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, '0')
  const yyyy = date.getFullYear()
  const MM = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

/**
 * ============================================================================
 * Bio Domain E2E Test Suite
 * ============================================================================
 * 1. Core Link & Folder Management (CRUD, Move, Toggle, Public Profile, Cleanup)
 * 2. Drag & Drop Reordering (dashboard and public order persistence)
 * 3. Link Click Analytics Tracking
 * 4. Link Scheduling Visibility Logic (Future, Expired, Active windows)
 * 5. SEO Metadata Editor (head tag generation)
 * 6. Pin Link to Top (priority placement)
 * 7. Sensitive Content Blur Overlay (18+ gate)
 * 8. Lead Capture Form Widget (opt-in newsletter submission)
 * 9. Custom Domain Mapping Engine (add, pending verification, remove)
 */
test.describe.serial('Bio Domain E2E Suite', () => {
  test.setTimeout(60_000)

  // --------------------------------------------------------------------------
  // 1. Core Link & Folder Management
  // --------------------------------------------------------------------------
  test('1.1 Can add a new link', async ({ page }) => {
    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    await page.getByRole('button', { name: 'Add Item' }).click()
    await page.locator('#title').fill(testLinkTitle)
    await page.getByLabel(/destination url/i).fill(testUrl)
    await page.getByRole('button', { name: 'Add Link', exact: true }).click()

    await expect(page.locator('h3').filter({ hasText: testLinkTitle }).first()).toBeVisible({ timeout: 10000 })
  })

  test('1.2 Can edit a link', async ({ page }) => {
    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    const targetRow = page.locator('div.group').filter({ hasText: testLinkTitle }).first()
    await targetRow.getByRole('button', { name: 'Edit' }).click()

    const updatedTitle = `${testLinkTitle} (Edited)`
    await page.locator('#title').fill(updatedTitle)
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.locator('h3').filter({ hasText: updatedTitle }).first()).toBeVisible({ timeout: 10000 })
  })

  test('1.3 Can create a folder and enforces 1-level limit', async ({ page }) => {
    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    await page.getByRole('button', { name: 'Add Item' }).click()
    await page.getByRole('tab', { name: 'Folder' }).click()
    await page.locator('#title').fill(testFolderTitle)
    await page.getByRole('button', { name: 'Add Folder', exact: true }).click()

    const folderRow = page.locator('div.group').filter({ hasText: testFolderTitle }).first()
    await expect(folderRow).toBeVisible({ timeout: 10000 })
    await expect(folderRow.getByRole('button', { name: 'Move' })).not.toBeVisible()
  })

  test('1.4 Can move a link into a folder', async ({ page }) => {
    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    const updatedTitle = `${testLinkTitle} (Edited)`
    const linkRow = page.locator('div.group').filter({ hasText: updatedTitle }).first()

    await linkRow.getByRole('button', { name: 'Move' }).click()
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: testFolderTitle }).click()
    await page.getByRole('button', { name: 'Move Link' }).click()

    await expect(linkRow).not.toBeVisible({ timeout: 10000 })

    await page.locator('div.group').filter({ hasText: testFolderTitle }).first().click()
    await expect(page.locator('h3').filter({ hasText: testLinkTitle }).first()).toBeVisible({ timeout: 10000 })
  })

  test('1.5 Renders the public profile with the newly created items', async ({ browser }) => {
    const username = process.env.E2E_TEST_USERNAME
    if (!username) throw new Error('E2E_TEST_USERNAME must be set')

    const guestContext = await browser.newContext({ storageState: undefined })
    const guestPage = await guestContext.newPage()
    await guestPage.goto(`/${username}`)

    await expect(guestPage.getByText('Powered by').first()).toBeVisible()
    await guestPage.getByText(testFolderTitle).click()
    await expect(guestPage.getByText(testLinkTitle)).toBeVisible({ timeout: 10000 })

    await guestContext.close()
  })

  test('1.6 Cleans up core link and folder test data', async ({ page }) => {
    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    const folderRow = page.locator('div.group').filter({ hasText: testFolderTitle }).first()
    if (await folderRow.isVisible()) {
      await folderRow.getByRole('button', { name: 'Delete' }).click()
      await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
      await expect(folderRow).not.toBeVisible({ timeout: 10000 })
    }

    const linkRow = page.locator('div.group').filter({ hasText: testLinkTitle }).first()
    if (await linkRow.isVisible()) {
      await linkRow.getByRole('button', { name: 'Delete' }).click()
      await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
      await expect(linkRow).not.toBeVisible({ timeout: 10000 })
    }
  })

  test('1.7 Can toggle a link active/inactive', async ({ page }) => {
    const toggleLinkName = `Toggle Test ${runId}`

    await page.goto('/bio')
    await page.getByRole('button', { name: 'Add Item' }).click()
    await page.locator('#title').fill(toggleLinkName)
    await page.getByLabel(/destination url/i).fill(testUrl)
    await page.getByRole('button', { name: 'Add Link', exact: true }).click()

    const row = page.locator('div.group').filter({ hasText: toggleLinkName }).first()
    const toggle = row.getByRole('switch')
    const initialState = (await toggle.getAttribute('aria-checked')) ?? 'true'

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', initialState === 'true' ? 'false' : 'true', { timeout: 10000 })

    await row.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  })

  // --------------------------------------------------------------------------
  // 2. Drag & Drop Reordering & Analytics
  // --------------------------------------------------------------------------
  test('2.1 Drag & drop link reordering and public profile persistence', async ({ page, browser }) => {
    const linkTitle1 = `DnD Alpha ${runId}`
    const linkTitle2 = `DnD Beta ${runId}`
    const linkTitle3 = `DnD Gamma ${runId}`
    const dndUrl = 'https://example.com/dnd'

    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    for (const title of [linkTitle1, linkTitle2, linkTitle3]) {
      await page.getByRole('button', { name: 'Add Item' }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 5000 })

      await dialog.locator('#title').fill(title)
      await dialog.getByLabel(/destination url/i).fill(dndUrl)
      await dialog.getByRole('button', { name: 'Add Link', exact: true }).click()
      await expect(dialog).not.toBeVisible({ timeout: 10000 })
      await expect(page.locator('h3').filter({ hasText: title }).first()).toBeVisible({ timeout: 10000 })
    }

    const row1 = page.locator('div.group').filter({ hasText: linkTitle1 }).first()
    const row3 = page.locator('div.group').filter({ hasText: linkTitle3 }).first()

    const handle1 = row1.getByRole('button', { name: 'Drag to reorder' })
    const handle3 = row3.getByRole('button', { name: 'Drag to reorder' })

    await handle3.dragTo(handle1)
    await page.waitForTimeout(1500)

    const username = process.env.E2E_TEST_USERNAME
    if (username) {
      const guestContext = await browser.newContext({ storageState: undefined })
      const guestPage = await guestContext.newPage()
      await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' })

      await expect(guestPage.getByText(linkTitle1)).toBeVisible({ timeout: 10000 })
      await expect(guestPage.getByText(linkTitle3)).toBeVisible({ timeout: 10000 })

      const pageContent = await guestPage.content()
      const posAlpha = pageContent.indexOf(linkTitle1)
      const posGamma = pageContent.indexOf(linkTitle3)
      expect(posGamma).toBeGreaterThan(-1)
      expect(posAlpha).toBeGreaterThan(-1)
      expect(posGamma).toBeLessThan(posAlpha)

      await guestContext.close()
    }

    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()
    for (const title of [linkTitle1, linkTitle2, linkTitle3]) {
      const targetRow = page.locator('div.group').filter({ hasText: title }).first()
      if (await targetRow.isVisible()) {
        await targetRow.scrollIntoViewIfNeeded()
        await targetRow.hover()
        await targetRow.getByRole('button', { name: 'Delete' }).click()

        const deleteDialog = page.getByRole('alertdialog')
        await expect(deleteDialog).toBeVisible({ timeout: 5000 })
        await deleteDialog.getByRole('button', { name: 'Delete' }).click()
        await expect(page.getByText('Link deleted!').first()).toBeVisible({ timeout: 10000 })
        await expect(targetRow).not.toBeVisible({ timeout: 10000 })
        await expect(deleteDialog).not.toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('2.2 Analytics click tracking', async ({ page, browser }) => {
    const analyticsLinkTitle = `Analytics Link ${runId}`
    const targetUrl = 'https://example.com/e2e-analytics-target'

    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    await page.getByRole('button', { name: 'Add Item' }).click()
    const addDialog = page.getByRole('dialog')
    await expect(addDialog).toBeVisible({ timeout: 5000 })
    await addDialog.locator('#title').fill(analyticsLinkTitle)
    await addDialog.getByLabel(/destination url/i).fill(targetUrl)
    await addDialog.getByRole('button', { name: 'Add Link', exact: true }).click()
    await expect(addDialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('h3').filter({ hasText: analyticsLinkTitle }).first()).toBeVisible({ timeout: 10000 })

    const username = process.env.E2E_TEST_USERNAME
    expect(username).toBeTruthy()

    const guestContext = await browser.newContext({ storageState: undefined })
    const guestPage = await guestContext.newPage()
    await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' })

    const publicLink = guestPage.getByText(analyticsLinkTitle).first()
    await expect(publicLink).toBeVisible({ timeout: 10000 })

    const [popup] = await Promise.all([
      guestPage.waitForEvent('popup'),
      publicLink.click(),
    ])

    await popup.waitForLoadState('domcontentloaded').catch(() => null)
    await guestContext.close()

    await page.goto('/bio/analytics')
    await expect(page.getByText(/Total Clicks/i).first()).toBeVisible({ timeout: 10000 })

    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()
    const row = page.locator('div.group').filter({ hasText: analyticsLinkTitle }).first()
    if (await row.isVisible()) {
      await row.scrollIntoViewIfNeeded()
      await row.hover()
      await row.getByRole('button', { name: 'Delete' }).click()

      const deleteDialog = page.getByRole('alertdialog')
      await expect(deleteDialog).toBeVisible({ timeout: 5000 })
      await deleteDialog.getByRole('button', { name: 'Delete' }).click()

      await expect(page.getByText('Link deleted!').first()).toBeVisible({ timeout: 10000 })
      await expect(row).not.toBeVisible({ timeout: 10000 })
      await expect(deleteDialog).not.toBeVisible({ timeout: 5000 })
    }
  })

  // --------------------------------------------------------------------------
  // 3. Link Scheduling Visibility Logic
  // --------------------------------------------------------------------------
  test('3.1 Link scheduling visibility logic (future, expired, active)', async ({ page, browser }) => {
    const futureLinkTitle = `Future Item ${runId}`
    const expiredLinkTitle = `Past Expiry Item ${runId}`
    const activeLinkTitle = `Active Window Item ${runId}`
    const scheduleUrl = 'https://example.com/schedule'

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const tomorrowStr = formatToDatetimeLocalString(tomorrow)
    const yesterdayStr = formatToDatetimeLocalString(yesterday)
    const dayAfterTomorrowStr = formatToDatetimeLocalString(dayAfterTomorrow)

    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    // Future link
    await page.getByRole('button', { name: 'Add Item' }).click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.locator('#title').fill(futureLinkTitle)
    await dialog.getByLabel(/destination url/i).fill(scheduleUrl)
    await dialog.locator('#schedule-toggle').click()
    await dialog.locator('#scheduled_at').fill(tomorrowStr)
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('h3').filter({ hasText: futureLinkTitle }).first()).toBeVisible({ timeout: 10000 })

    const futureRow = page.locator('div.group').filter({ hasText: futureLinkTitle }).first()
    await expect(futureRow.getByText(/Goes live/i)).toBeVisible({ timeout: 10000 })

    // Expired link
    await page.getByRole('button', { name: 'Add Item' }).click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.locator('#title').fill(expiredLinkTitle)
    await dialog.getByLabel(/destination url/i).fill(scheduleUrl)
    await dialog.locator('#schedule-toggle').click()
    await dialog.locator('#expires_at').fill(yesterdayStr)
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('h3').filter({ hasText: expiredLinkTitle }).first()).toBeVisible({ timeout: 10000 })

    const expiredRow = page.locator('div.group').filter({ hasText: expiredLinkTitle }).first()
    await expect(expiredRow.getByText(/🔴 Expired/i)).toBeVisible({ timeout: 10000 })

    // Active link
    await page.getByRole('button', { name: 'Add Item' }).click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.locator('#title').fill(activeLinkTitle)
    await dialog.getByLabel(/destination url/i).fill(scheduleUrl)
    await dialog.locator('#schedule-toggle').click()
    await dialog.locator('#scheduled_at').fill(yesterdayStr)
    await dialog.locator('#expires_at').fill(dayAfterTomorrowStr)
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('h3').filter({ hasText: activeLinkTitle }).first()).toBeVisible({ timeout: 10000 })

    const activeRow = page.locator('div.group').filter({ hasText: activeLinkTitle }).first()
    await expect(activeRow.getByText(/🟢 Live until/i)).toBeVisible({ timeout: 10000 })

    // Verify public profile
    const username = process.env.E2E_TEST_USERNAME
    if (username) {
      const guestContext = await browser.newContext({ storageState: undefined })
      const guestPage = await guestContext.newPage()
      await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' })

      await expect(guestPage.getByText(futureLinkTitle)).not.toBeVisible({ timeout: 5000 })
      await expect(guestPage.getByText(expiredLinkTitle)).not.toBeVisible({ timeout: 5000 })
      await expect(guestPage.getByText(activeLinkTitle)).toBeVisible({ timeout: 10000 })

      await guestContext.close()
    }

    // Cleanup
    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()
    for (const title of [futureLinkTitle, expiredLinkTitle, activeLinkTitle]) {
      const targetRow = page.locator('div.group').filter({ hasText: title }).first()
      if (await targetRow.isVisible()) {
        await targetRow.scrollIntoViewIfNeeded()
        await targetRow.hover()
        await targetRow.getByRole('button', { name: 'Delete' }).click()

        const deleteDialog = page.getByRole('alertdialog')
        await expect(deleteDialog).toBeVisible({ timeout: 5000 })
        await deleteDialog.getByRole('button', { name: 'Delete' }).click()

        await expect(page.getByText('Link deleted!').first()).toBeVisible({ timeout: 10000 })
        await expect(targetRow).not.toBeVisible({ timeout: 10000 })
        await expect(deleteDialog).not.toBeVisible({ timeout: 5000 })
      }
    }
  })

  // --------------------------------------------------------------------------
  // 4. Creator Features (SEO, Pinning, Sensitive Blur, Leads, Domains)
  // --------------------------------------------------------------------------
  test('4.1 SEO metadata editor auto-saves and renders in public head', async ({ page, browser }) => {
    const testTitle = `E2E SEO Title ${runId}`
    const testDescription = `E2E SEO Description for automated testing ${runId}`

    await page.goto('/bio?tab=appearance')

    const metaTitleInput = page.locator('#meta-title')
    await metaTitleInput.scrollIntoViewIfNeeded()
    await metaTitleInput.fill(testTitle)

    const metaDescInput = page.locator('#meta-description')
    await metaDescInput.fill(testDescription)

    await expect(page.getByText('Saved').first()).toBeVisible({ timeout: 10000 })

    const username = process.env.E2E_TEST_USERNAME
    expect(username).toBeTruthy()

    const guestContext = await browser.newContext({ storageState: undefined })
    const guestPage = await guestContext.newPage()
    await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' })

    const pageTitle = await guestPage.title()
    expect(pageTitle).toContain(testTitle)

    const metaDescription = await guestPage.locator('meta[name="description"]').getAttribute('content')
    expect(metaDescription).toContain(testDescription)

    await guestContext.close()

    await page.goto('/bio?tab=appearance')
    const metaTitleClean = page.locator('#meta-title')
    await metaTitleClean.scrollIntoViewIfNeeded()
    await metaTitleClean.fill('')
    await page.locator('#meta-description').fill('')
    await expect(page.getByText('Saved').first()).toBeVisible({ timeout: 10000 })
  })

  test('4.2 Pin link to top and sensitive content blur overlay', async ({ page, browser }) => {
    const linkA = `Pin Alpha ${runId}`
    const linkB = `Pin Beta ${runId}`
    const sensitiveTitle = `Sensitive Link ${runId}`
    const pinUrl = 'https://example.com/pin-test'
    const sensitiveUrl = 'https://example.com/sensitive-test'

    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    // Link A (unpinned)
    await page.getByRole('button', { name: 'Add Item' }).click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.locator('#title').fill(linkA)
    await dialog.getByLabel(/destination url/i).fill(pinUrl)
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })

    // Link B (pinned)
    await page.getByRole('button', { name: 'Add Item' }).click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.locator('#title').fill(linkB)
    await dialog.getByLabel(/destination url/i).fill(pinUrl)
    await dialog.locator('#pin-toggle').click()
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })

    // Link C (sensitive)
    await page.getByRole('button', { name: 'Add Item' }).click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.locator('#title').fill(sensitiveTitle)
    await dialog.getByLabel(/destination url/i).fill(sensitiveUrl)
    await dialog.locator('#sensitive-toggle').click()
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })

    // Verify pinned & sensitive badges on dashboard
    const pinnedRow = page.locator('div.group').filter({ hasText: linkB }).first()
    await expect(pinnedRow.getByText('📌')).toBeVisible({ timeout: 5000 })
    const sensitiveRow = page.locator('div.group').filter({ hasText: sensitiveTitle }).first()
    await expect(sensitiveRow.getByText('🔞')).toBeVisible({ timeout: 5000 })

    // Verify public view
    const username = process.env.E2E_TEST_USERNAME
    expect(username).toBeTruthy()

    const guestContext = await browser.newContext({ storageState: undefined })
    const guestPage = await guestContext.newPage()
    await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' })

    await expect(guestPage.getByText(linkA)).toBeVisible({ timeout: 10000 })
    await expect(guestPage.getByText(linkB)).toBeVisible({ timeout: 10000 })

    const pageContent = await guestPage.content()
    const posB = pageContent.indexOf(linkB)
    const posA = pageContent.indexOf(linkA)
    expect(posB).toBeGreaterThan(-1)
    expect(posA).toBeGreaterThan(-1)
    expect(posB).toBeLessThan(posA)

    const revealButton = guestPage.getByLabel('Click to reveal sensitive content')
    await expect(revealButton).toBeVisible({ timeout: 10000 })
    await revealButton.click()
    await expect(guestPage.getByText(sensitiveTitle)).toBeVisible({ timeout: 5000 })

    await guestContext.close()

    // Cleanup
    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()
    for (const title of [linkA, linkB, sensitiveTitle]) {
      const row = page.locator('div.group').filter({ hasText: title }).first()
      if (await row.isVisible()) {
        await row.scrollIntoViewIfNeeded()
        await row.hover()
        await row.getByRole('button', { name: 'Delete' }).click()
        const deleteDialog = page.getByRole('alertdialog')
        await expect(deleteDialog).toBeVisible({ timeout: 5000 })
        await deleteDialog.getByRole('button', { name: 'Delete' }).click()
        await expect(page.getByText('Link deleted!').first()).toBeVisible({ timeout: 10000 })
        await expect(row).not.toBeVisible({ timeout: 10000 })
        await expect(deleteDialog).not.toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('4.3 Lead capture form submission & custom domain settings modal', async ({ page, browser }) => {
    const testEmail = `e2e-${runId}@test.kytbox.app`
    const testDomain = `e2e-${runId}.localhost`
    const username = process.env.E2E_TEST_USERNAME
    expect(username).toBeTruthy()

    // Lead capture setup & public submission
    await page.goto('/bio?tab=subscribers')
    const leadToggle = page.getByRole('switch').first()
    const isChecked = await leadToggle.getAttribute('aria-checked')
    if (isChecked !== 'true') {
      await leadToggle.click()
      await expect(leadToggle).toHaveAttribute('aria-checked', 'true', { timeout: 5000 })
      await page.waitForTimeout(1000)
    }

    const guestContext = await browser.newContext({ storageState: undefined })
    const guestPage = await guestContext.newPage()
    await guestPage.goto(`/${username}`, { waitUntil: 'networkidle' })

    const emailInput = guestPage.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 15000 })
    await emailInput.click()
    await emailInput.fill(testEmail)
    const subscribeBtn = guestPage.getByRole('button', { name: /subscribe/i })
    await expect(subscribeBtn).toBeEnabled({ timeout: 10000 })
    await subscribeBtn.click()

    await expect(guestPage.getByText(/successfully subscribed/i)).toBeVisible({ timeout: 10000 })
    await guestContext.close()

    // Verify subscriber in dashboard
    await page.goto('/bio?tab=subscribers')
    const subscriberRow = page.locator('tr').filter({ hasText: testEmail }).first()
    await expect(subscriberRow).toBeVisible({ timeout: 15000 })

    const deleteBtn = subscriberRow.getByRole('button', { name: 'Delete subscriber' })
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
      await expect(subscriberRow).not.toBeVisible({ timeout: 10000 })
    }

    // Custom domain settings modal
    await page.goto('/bio')
    await page.getByTitle('Custom Domain Setup').click()

    const domainInput = page.locator('#customDomainInput')
    await expect(domainInput).toBeVisible({ timeout: 5000 })
    await domainInput.fill(testDomain)
    await page.getByRole('button', { name: /add domain/i }).click()

    await expect(page.getByText(/custom domain added/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/pending verification/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/dns configuration steps/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(testDomain)).toBeVisible()
    await expect(page.getByRole('button', { name: /verify domain/i })).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /remove/i }).click()

    await expect(page.getByText(/custom domain removed/i)).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#customDomainInput')).toBeVisible({ timeout: 5000 })
  })
})
