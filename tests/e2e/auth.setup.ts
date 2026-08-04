import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../../playwright/.auth/user.json')
const adminAuthFile = path.join(__dirname, '../../playwright/.auth/admin.json')

setup('authenticate user', async ({ page }) => {
  await page.context().clearCookies()
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD

  if (!email || !password) {
    throw new Error(
      'E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set in .env.local',
    )
  }

  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await page.waitForURL('**/app', { timeout: 15_000 })
  await expect(page).toHaveURL(/\/app/)
  await page.context().storageState({ path: authFile })
})

setup('authenticate admin', async ({ page }) => {
  await page.context().clearCookies()
  const adminEmail = process.env.E2E_ADMIN_EMAIL
  const adminPassword = process.env.E2E_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set in .env.local',
    )
  }

  await page.goto('/login')
  await page.locator('#email').fill(adminEmail)
  await page.locator('#password').fill(adminPassword)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await page.waitForURL('**/app', { timeout: 15_000 })
  await expect(page).toHaveURL(/\/app/)
  await page.context().storageState({ path: adminAuthFile })
})
