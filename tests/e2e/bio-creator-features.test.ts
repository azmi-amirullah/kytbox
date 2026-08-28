import { test, expect } from '@playwright/test'

const runId = Date.now()

/**
 * Day 6 — Bio Creator Features E2E Test Suite
 *
 * Validates Week 1 features:
 * - SEO Metadata Editor (Day 1)
 * - Pin Link to Top (Day 4)
 * - Sensitive Content Blur Overlay (Day 4)
 * - Lead Capture Form Submission (Day 3)
 * - Custom Domain Settings Modal (Day 5)
 */
test.describe.serial('Bio Creator Features E2E', () => {
  test.setTimeout(60_000)

  test('1. SEO Metadata Editor — auto-saves and renders in public head', async ({ page, browser }) => {
    const testTitle = `E2E SEO Title ${runId}`
    const testDescription = `E2E SEO Description for automated testing ${runId}`

    // Navigate to Appearance tab
    await page.goto('/bio?tab=appearance')

    // Scroll to SEO card and fill in meta title
    const metaTitleInput = page.locator('#meta-title')
    await metaTitleInput.scrollIntoViewIfNeeded()
    await metaTitleInput.fill(testTitle)

    // Fill meta description
    const metaDescInput = page.locator('#meta-description')
    await metaDescInput.fill(testDescription)

    // Wait for auto-save (debounced at 1000ms + 500ms min duration)
    await expect(page.getByText('Saved').first()).toBeVisible({ timeout: 10000 })

    // Verify public profile <head> metadata
    const username = process.env.E2E_TEST_USERNAME
    expect(username).toBeTruthy()

    const guestContext = await browser.newContext({ storageState: undefined })
    const guestPage = await guestContext.newPage()
    await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' })

    // Assert <title> contains our custom SEO title
    const pageTitle = await guestPage.title()
    expect(pageTitle).toContain(testTitle)

    // Assert <meta name="description"> contains our custom description
    const metaDescription = await guestPage.locator('meta[name="description"]').getAttribute('content')
    expect(metaDescription).toContain(testDescription)

    await guestContext.close()

    // Cleanup: clear SEO fields
    await page.goto('/bio?tab=appearance')
    const metaTitleClean = page.locator('#meta-title')
    await metaTitleClean.scrollIntoViewIfNeeded()
    await metaTitleClean.fill('')
    await page.locator('#meta-description').fill('')
    await expect(page.getByText('Saved').first()).toBeVisible({ timeout: 10000 })
  })

  test('2. Pin Link to Top — pinned link appears first on public profile', async ({ page, browser }) => {
    const linkA = `Pin Alpha ${runId}`
    const linkB = `Pin Beta ${runId}`
    const testUrl = 'https://example.com/pin-test'

    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    // Create Link A (unpinned)
    await page.getByRole('button', { name: 'Add Item' }).click()
    let dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.locator('#title').fill(linkA)
    await dialog.getByLabel(/destination url/i).fill(testUrl)
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('h3').filter({ hasText: linkA }).first()).toBeVisible({ timeout: 10000 })

    // Create Link B (will be pinned)
    await page.getByRole('button', { name: 'Add Item' }).click()
    dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.locator('#title').fill(linkB)
    await dialog.getByLabel(/destination url/i).fill(testUrl)
    // Toggle pin before saving
    await dialog.locator('#pin-toggle').click()
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('h3').filter({ hasText: linkB }).first()).toBeVisible({ timeout: 10000 })

    // Verify pinned badge is visible on dashboard
    const pinnedRow = page.locator('div.group').filter({ hasText: linkB }).first()
    await expect(pinnedRow.getByText('📌')).toBeVisible({ timeout: 5000 })

    // Visit public profile as guest — Link B (pinned) should appear before Link A
    const username = process.env.E2E_TEST_USERNAME
    expect(username).toBeTruthy()

    const guestContext = await browser.newContext({ storageState: undefined })
    const guestPage = await guestContext.newPage()
    await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' })

    await expect(guestPage.getByText(linkA)).toBeVisible({ timeout: 10000 })
    await expect(guestPage.getByText(linkB)).toBeVisible({ timeout: 10000 })

    // Assert DOM order: pinned Link B appears before Link A
    const pageContent = await guestPage.content()
    const posB = pageContent.indexOf(linkB)
    const posA = pageContent.indexOf(linkA)
    expect(posB).toBeGreaterThan(-1)
    expect(posA).toBeGreaterThan(-1)
    expect(posB).toBeLessThan(posA)

    await guestContext.close()

    // Cleanup
    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()
    for (const title of [linkA, linkB]) {
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

  test('3. Sensitive Content Blur Overlay — requires click to reveal', async ({ page, browser }) => {
    const sensitiveTitle = `Sensitive Link ${runId}`
    const testUrl = 'https://example.com/sensitive-test'

    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()

    // Create a sensitive link
    await page.getByRole('button', { name: 'Add Item' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await dialog.locator('#title').fill(sensitiveTitle)
    await dialog.getByLabel(/destination url/i).fill(testUrl)
    await dialog.locator('#sensitive-toggle').click()
    await dialog.getByRole('button', { name: 'Add Link', exact: true }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('h3').filter({ hasText: sensitiveTitle }).first()).toBeVisible({ timeout: 10000 })

    // Verify sensitive badge on dashboard
    const sensitiveRow = page.locator('div.group').filter({ hasText: sensitiveTitle }).first()
    await expect(sensitiveRow.getByText('🔞')).toBeVisible({ timeout: 5000 })

    // Visit public profile as guest
    const username = process.env.E2E_TEST_USERNAME
    expect(username).toBeTruthy()

    const guestContext = await browser.newContext({ storageState: undefined })
    const guestPage = await guestContext.newPage()
    await guestPage.goto(`/${username}`, { waitUntil: 'domcontentloaded' })

    // The blur overlay button should be visible
    const revealButton = guestPage.getByLabel('Click to reveal sensitive content')
    await expect(revealButton).toBeVisible({ timeout: 10000 })

    // The link text should NOT be directly visible (it's behind blur)
    // After clicking reveal, the link text becomes visible
    await revealButton.click()
    await expect(guestPage.getByText(sensitiveTitle)).toBeVisible({ timeout: 5000 })

    await guestContext.close()

    // Cleanup
    await page.goto('/bio')
    await page.getByRole('tab', { name: /links/i }).click()
    const row = page.locator('div.group').filter({ hasText: sensitiveTitle }).first()
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

  test('4. Lead Capture Form — subscriber submission and dashboard visibility', async ({ page, browser }) => {
    const testEmail = `e2e-${runId}@test.kytbox.app`
    const username = process.env.E2E_TEST_USERNAME
    expect(username).toBeTruthy()

    // Ensure lead capture is enabled in the Subscribers tab
    await page.goto('/bio?tab=subscribers')
    const leadToggle = page.getByRole('switch').first()
    const isChecked = await leadToggle.getAttribute('aria-checked')
    if (isChecked !== 'true') {
      await leadToggle.click()
      await expect(leadToggle).toHaveAttribute('aria-checked', 'true', { timeout: 5000 })
      await page.waitForTimeout(1000)
    }

    // Visit public profile as guest and submit the lead capture form
    const guestContext = await browser.newContext({ storageState: undefined })
    const guestPage = await guestContext.newPage()
    await guestPage.goto(`/${username}`, { waitUntil: 'networkidle' })

    // Find the email input within the lead capture widget
    const emailInput = guestPage.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 15000 })
    
    // Click to focus, fill email, and wait for React state to enable button
    await emailInput.click()
    await emailInput.fill(testEmail)
    const subscribeBtn = guestPage.getByRole('button', { name: /subscribe/i })
    await expect(subscribeBtn).toBeEnabled({ timeout: 10000 })
    await subscribeBtn.click()

    // Assert success message
    await expect(guestPage.getByText(/successfully subscribed/i)).toBeVisible({ timeout: 10000 })

    await guestContext.close()

    // Verify in dashboard Subscribers tab
    await page.goto('/bio?tab=subscribers')
    const subscriberRow = page.locator('tr').filter({ hasText: testEmail }).first()
    await expect(subscriberRow).toBeVisible({ timeout: 15000 })

    // Cleanup: delete the created subscriber
    const deleteBtn = subscriberRow.getByRole('button', { name: 'Delete subscriber' })
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
      await expect(subscriberRow).not.toBeVisible({ timeout: 10000 })
    }
  })

  test('5. Custom Domain Settings Modal — add, pending verification, and remove flow', async ({ page }) => {
    const testDomain = `e2e-${runId}.localhost`

    await page.goto('/bio')

    // Open domain modal via gear icon
    await page.getByTitle('Custom Domain Setup').click()

    // Wait for modal to appear
    const domainInput = page.locator('#customDomainInput')
    await expect(domainInput).toBeVisible({ timeout: 5000 })

    // Fill domain and submit
    await domainInput.fill(testDomain)
    await page.getByRole('button', { name: /add domain/i }).click()

    // Assert success message
    await expect(page.getByText(/custom domain added/i)).toBeVisible({ timeout: 10000 })

    // Assert pending verification badge
    await expect(page.getByText(/pending verification/i)).toBeVisible({ timeout: 5000 })

    // Assert DNS configuration instructions are shown
    await expect(page.getByText(/dns configuration steps/i)).toBeVisible({ timeout: 5000 })

    // Assert the domain name is displayed
    await expect(page.getByText(testDomain)).toBeVisible()

    // Assert Verify Domain button is visible
    await expect(page.getByRole('button', { name: /verify domain/i })).toBeVisible()

    // Remove the domain — register confirm handler before clicking
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /remove/i }).click()

    // After removal, the input form should reappear
    await expect(page.getByText(/custom domain removed/i)).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#customDomainInput')).toBeVisible({ timeout: 5000 })
  })

})
