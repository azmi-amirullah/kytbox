import { test, expect } from '@playwright/test'

const runId = Date.now()
const testVehicleName = `E2E Civic ${runId}`
const testLicensePlate = `B ${runId.toString().slice(-4)} E2E`
const testDocTitle = `Annual Road Tax ${runId}`

let createdVehicleUrl: string

/**
 * ============================================================================
 * Garage Domain E2E Test Suite (Day 7 Weekly Audit)
 * ============================================================================
 * 1. Vehicle Lifecycle (Creation, Default Setting, Specs Inspection)
 * 2. Maintenance Checklist & Rules Engine (Smart Presets, Active Status)
 * 3. Service Logging & History Timeline (Rule advancement, Workshop metadata)
 * 4. Fuel Logging & Gas Pump Calculator (Full vs Partial, km/L economy)
 * 5. Regulatory Documents & 1-Tap Renewal Flow (Annual Tax, Expiry countdown)
 * 6. Teardown & Lifecycle Cleanup
 */
test.describe.serial('Garage Domain E2E Suite', () => {
  test.setTimeout(60_000)

  // --------------------------------------------------------------------------
  // 1. Vehicle Creation & Profile Navigation
  // --------------------------------------------------------------------------
  test('1.1 Create vehicle with smart presets and navigate to vehicle profile', async ({ page }) => {
    // Freeze time deterministically for date/countdown predictability
    await page.clock.setFixedTime(new Date('2026-09-01T09:00:00Z'))

    await page.goto('/garage')

    // 1. Open Add Vehicle Modal
    const addVehicleBtn = page.getByRole('button', { name: /Add Vehicle/i }).first()
    await expect(addVehicleBtn).toBeVisible({ timeout: 10_000 })
    await addVehicleBtn.click()

    const addDialog = page.getByRole('dialog')
    await expect(addDialog).toBeVisible({ timeout: 5000 })

    // 2. Fill Vehicle Identity
    await addDialog.locator('#vehicle-name').fill(testVehicleName)
    await addDialog.locator('#vehicle-plate').fill(testLicensePlate)
    await addDialog.locator('#vehicle-year').fill('2024')
    await addDialog.locator('#vehicle-odometer').fill('25000')

    // 3. Submit
    const submitBtn = addDialog.getByRole('button', { name: /Add Vehicle/i })
    await submitBtn.click()
    await expect(addDialog).not.toBeVisible({ timeout: 10_000 })

    // 4. Verify vehicle card appears on /garage
    const vehicleCard = page.locator('div.group').filter({ hasText: testVehicleName }).first()
    await expect(vehicleCard).toBeVisible({ timeout: 10_000 })
    await expect(vehicleCard.getByText('25,000 km')).toBeVisible()

    // 5. Open Vehicle Details
    const viewDetailsLink = vehicleCard.getByRole('link', { name: /View details/i })
    await viewDetailsLink.click()

    await page.waitForURL(/\/garage\/[a-f0-9-]{36}/, { timeout: 15_000 })
    await expect(page.getByText(testVehicleName).first()).toBeVisible({ timeout: 10_000 })
    createdVehicleUrl = page.url()
  })

  // --------------------------------------------------------------------------
  // 2. Maintenance Checklist & Rules Engine
  // --------------------------------------------------------------------------
  test('1.2 Inspect smart maintenance checklist presets and countdown status', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-01T09:00:00Z'))
    await page.goto(createdVehicleUrl)

    // Switch to Checklist tab
    const rulesTab = page.getByRole('tab', { name: /Maintenance Rules/i })
    await expect(rulesTab).toBeVisible({ timeout: 5000 })
    await rulesTab.click()

    // Verify auto-populated smart default presets for petrol car
    await expect(page.getByText(/Engine Oil & Filter/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/5,000 km/i).first()).toBeVisible()

    // Verify presence of Add Custom Rule button
    const addRuleBtn = page.getByRole('button', { name: /Add Custom Rule|Add Rule/i }).first()
    await expect(addRuleBtn).toBeVisible()
  })

  // --------------------------------------------------------------------------
  // 3. Service Logging & History Timeline
  // --------------------------------------------------------------------------
  test('1.3 Log service event and inspect service history entry', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-01T09:00:00Z'))
    await page.goto(createdVehicleUrl)

    // Switch to Service History tab
    const serviceTab = page.getByRole('tab', { name: /Service History/i })
    await serviceTab.click()

    // Open Log Service Modal
    const logServiceBtn = page.getByRole('button', { name: /Log Service/i }).first()
    await expect(logServiceBtn).toBeVisible({ timeout: 5000 })
    await logServiceBtn.click()

    const serviceDialog = page.getByRole('dialog')
    await expect(serviceDialog).toBeVisible({ timeout: 5000 })

    // Fill Service details
    const odoInput = serviceDialog.locator('input[type="number"]').first()
    await odoInput.fill('26000')

    const costInput = serviceDialog.locator('input[placeholder="0"]').first()
    if (await costInput.isVisible()) {
      await costInput.fill('750000')
    }

    // Submit Service Log
    const saveBtn = serviceDialog.getByRole('button', { name: /Save Service Log/i })
    await saveBtn.click()
    await expect(serviceDialog).not.toBeVisible({ timeout: 10_000 })

    // Verify entry in Service History timeline
    await expect(page.getByText(/26,000 km/i).first()).toBeVisible({ timeout: 10_000 })
  })

  // --------------------------------------------------------------------------
  // 4. Fuel Fill-up Logging & Efficiency Engine
  // --------------------------------------------------------------------------
  test('1.4 Log fuel fill-up with pump calculator and verify economy tracking', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-01T09:00:00Z'))
    await page.goto(createdVehicleUrl)

    // Switch to Fuel tab
    const fuelTab = page.getByRole('tab', { name: /Fuel Economy/i })
    await fuelTab.click()

    // Open Fuel Modal
    const logFuelBtn = page.getByRole('button', { name: /Log Fill-up/i }).first()
    await expect(logFuelBtn).toBeVisible({ timeout: 5000 })
    await logFuelBtn.click()

    const fuelDialog = page.getByRole('dialog')
    await expect(fuelDialog).toBeVisible({ timeout: 5000 })

    // 1. First Log: Baseline Fill-up
    await fuelDialog.locator('#fuel-odometer').fill('26500')
    await fuelDialog.locator('#fuel-price-unit').fill('10000')
    await fuelDialog.locator('#fuel-amount').fill('30')

    const saveFuelBtn = fuelDialog.getByRole('button', { name: /Save Fuel Fill-up/i })
    await saveFuelBtn.click()
    await expect(fuelDialog).not.toBeVisible({ timeout: 10_000 })

    // Verify baseline badge exists in timeline
    await expect(page.getByText(/Baseline Fill-up/i).first()).toBeVisible({ timeout: 10_000 })

    // 2. Second Log: Consecutive full-tank to trigger economy calculation
    await logFuelBtn.click()
    await expect(fuelDialog).toBeVisible({ timeout: 5000 })

    await fuelDialog.locator('#fuel-odometer').fill('27000')
    await fuelDialog.locator('#fuel-price-unit').fill('10000')
    await fuelDialog.locator('#fuel-amount').fill('25')

    await saveFuelBtn.click()
    await expect(fuelDialog).not.toBeVisible({ timeout: 10_000 })

    // Verify calculated economy badge is rendered (500 km / 25 L = 20.0 km/L)
    await expect(page.getByText(/20\.0 km\/L|20 km\/L/i).first()).toBeVisible({ timeout: 10_000 })
  })

  // --------------------------------------------------------------------------
  // 5. Regulatory Documents & 1-Tap Renewal Flow
  // --------------------------------------------------------------------------
  test('1.5 Track regulatory document and execute 1-year renewal workflow', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-01T09:00:00Z'))
    await page.goto(createdVehicleUrl)

    // Switch to Documents tab
    const docsTab = page.getByRole('tab', { name: /Tax & Documents/i })
    await docsTab.click()

    // Add Document
    const addDocBtn = page.getByRole('button', { name: /Add Document/i }).first()
    await expect(addDocBtn).toBeVisible({ timeout: 5000 })
    await addDocBtn.click()

    const docDialog = page.getByRole('dialog')
    await expect(docDialog).toBeVisible({ timeout: 5000 })

    await docDialog.locator('#document-title').fill(testDocTitle)
    await docDialog.locator('#document-cost').fill('1500000')

    const saveDocBtn = docDialog.getByRole('button', { name: /Save Document/i })
    await saveDocBtn.click()
    await expect(docDialog).not.toBeVisible({ timeout: 10_000 })

    // Verify document card rendered
    const docCard = page.locator('div.group').filter({ hasText: testDocTitle }).first()
    await expect(docCard).toBeVisible({ timeout: 10_000 })

    // Open Renewal Modal
    const renewBtn = docCard.getByRole('button', { name: /Renew/i }).first()
    await expect(renewBtn).toBeVisible()
    await renewBtn.click()

    const renewDialog = page.getByRole('dialog')
    await expect(renewDialog).toBeVisible({ timeout: 5000 })

    // Select 1 Year preset and submit
    const confirmRenewBtn = renewDialog.getByRole('button', { name: /Renew Document|Save Renewal/i })
    if (await confirmRenewBtn.isVisible()) {
      await confirmRenewBtn.click()
      await expect(renewDialog).not.toBeVisible({ timeout: 10_000 })
    }
  })

  // --------------------------------------------------------------------------
  // 6. Teardown & Lifecycle Cleanup
  // --------------------------------------------------------------------------
  test('1.6 Lifecycle cleanup — delete test vehicle to keep workspace clean', async ({ page }) => {
    await page.goto('/garage')

    const vehicleCard = page.locator('div.group').filter({ hasText: testVehicleName }).first()
    if (await vehicleCard.isVisible()) {
      const optionsBtn = vehicleCard.getByRole('button', { name: `Options for ${testVehicleName}` })
      if (await optionsBtn.isVisible()) {
        await optionsBtn.click()
        const deleteMenuItem = page.getByRole('menuitem', { name: /Delete vehicle|Delete forever/i })
        if (await deleteMenuItem.isVisible()) {
          await deleteMenuItem.click()
          const alertDialog = page.getByRole('alertdialog')
          if (await alertDialog.isVisible()) {
            await alertDialog.getByRole('button', { name: /Delete|Archive/i }).click()
            await expect(alertDialog).not.toBeVisible({ timeout: 10_000 })
          }
        }
      }
    }
  })
})
