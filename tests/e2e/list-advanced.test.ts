import { test, expect } from '@playwright/test';

/**
 * End-to-End Test Suite for Week 3 List App Advanced Features (Day 20):
 * 1. Pre-built Board Templates (TemplatePickerModal, template creation with columns & starter cards)
 * 2. Card Due Dates & Quick Selectors (Today, Tomorrow, relative badges & urgency styling)
 * 3. Card Priority Levels & Toolbar Filtering/Sorting (Urgent/High/Medium/Low, filter buttons, sort menu)
 * 4. Card Subtasks & Checklist Engine with Progress Calculation (Add, complete, edit, delete subtasks, progress bar, card badge)
 * 5. Recurring Tasks Engine & Cycle Advancement (Recurrence rules, completion advancement, reset subtasks, toast feedback)
 * 6. Lifecycle Cleanup (Board deletion)
 */
test.describe.serial('List App Advanced Features E2E', () => {
  let createdBoardUrl: string;

  test('1. Pre-built Board Templates — choose template, auto-populate columns & starter cards', async ({ page }) => {
    await page.goto('/list/todo');

    // 1. Open Template Picker Modal
    const templatePickerBtn = page.locator('#open-template-picker, button:has-text("Templates")').first();
    await expect(templatePickerBtn).toBeVisible({ timeout: 10_000 });
    await templatePickerBtn.click();

    const templateDialog = page.getByRole('dialog').filter({ hasText: /Choose a Template/i });
    await expect(templateDialog).toBeVisible({ timeout: 5000 });

    // 2. Verify available templates are rendered
    await expect(templateDialog.getByText('Sprint Board')).toBeVisible();
    await expect(templateDialog.getByText('Content Calendar')).toBeVisible();
    await expect(templateDialog.getByText('Weekly Planner')).toBeVisible();
    await expect(templateDialog.getByText('Bug Tracker')).toBeVisible();

    // 3. Select "Sprint Board" template
    const sprintTemplateCard = templateDialog.locator('div[role="button"]').filter({ hasText: 'Sprint Board' }).first();
    await sprintTemplateCard.click();

    // 4. Wait for redirection to generated board
    await page.waitForURL(/\/list\/todo\/[a-f0-9-]+/, { timeout: 15_000 });
    createdBoardUrl = page.url();

    // 5. Verify pre-seeded columns from Sprint Board template
    await expect(page.getByText('Backlog', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Todo', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('In Progress', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Review', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Done', { exact: true }).first()).toBeVisible({ timeout: 10_000 });

    // 6. Verify starter cards populated from template
    await expect(page.getByText('Define sprint goal').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Break down user stories').first()).toBeVisible({ timeout: 10_000 });
  });

  test('2. Card Due Dates & Quick Selectors — set date, quick buttons, and relative badge indicators', async ({ page }) => {
    await page.goto(createdBoardUrl);

    // 1. Open Edit Modal for "Break down user stories"
    const card = page.locator('div.group').filter({ hasText: 'Break down user stories' }).first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.getByRole('button', { name: /Edit task/i }).click();

    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible({ timeout: 5000 });

    // 2. Test Quick Date button: "Tomorrow"
    const tomorrowBtn = editDialog.getByRole('button', { name: 'Tomorrow', exact: true });
    await expect(tomorrowBtn).toBeVisible();
    await tomorrowBtn.click();

    // Save changes
    await editDialog.getByRole('button', { name: /Save Changes/i }).click();
    await expect(editDialog).not.toBeVisible({ timeout: 10_000 });

    // 3. Verify Relative Due Date Badge rendered on Kanban Card
    await expect(card.getByText('Tomorrow').first()).toBeVisible({ timeout: 10_000 });

    // 4. Reopen and change to "Today"
    await card.getByRole('button', { name: /Edit task/i }).click();
    await expect(editDialog).toBeVisible({ timeout: 5000 });

    const todayBtn = editDialog.getByRole('button', { name: 'Today', exact: true });
    await todayBtn.click();
    await editDialog.getByRole('button', { name: /Save Changes/i }).click();
    await expect(editDialog).not.toBeVisible({ timeout: 10_000 });

    // Verify "Today" badge
    await expect(card.getByText(/Today/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('3. Card Priority Levels & Toolbar Filtering / Sorting Engine', async ({ page }) => {
    await page.goto(createdBoardUrl);

    // 1. Set "Define sprint goal" -> Priority: Urgent
    const card1 = page.locator('div.group').filter({ hasText: 'Define sprint goal' }).first();
    await card1.getByRole('button', { name: /Edit task/i }).click();
    let editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();

    const urgentBtn = editDialog.getByRole('button', { name: 'Urgent', exact: true });
    await urgentBtn.click();
    await editDialog.getByRole('button', { name: /Save Changes/i }).click();
    await expect(editDialog).not.toBeVisible({ timeout: 10_000 });

    // 2. Set "Break down user stories" -> Priority: High
    const card2 = page.locator('div.group').filter({ hasText: 'Break down user stories' }).first();
    await card2.getByRole('button', { name: /Edit task/i }).click();
    editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();

    const highBtn = editDialog.getByRole('button', { name: 'High', exact: true });
    await highBtn.click();
    await editDialog.getByRole('button', { name: /Save Changes/i }).click();
    await expect(editDialog).not.toBeVisible({ timeout: 10_000 });

    // 3. Set "Set up project repo" -> Priority: Low
    const card3 = page.locator('div.group').filter({ hasText: 'Set up project repo' }).first();
    await card3.getByRole('button', { name: /Edit task/i }).click();
    editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();

    const lowBtn = editDialog.getByRole('button', { name: 'Low', exact: true });
    await lowBtn.click();
    await editDialog.getByRole('button', { name: /Save Changes/i }).click();
    await expect(editDialog).not.toBeVisible({ timeout: 10_000 });

    // 4. Verify Priority Badges on cards
    await expect(card1.getByText('Urgent').first()).toBeVisible({ timeout: 10_000 });
    await expect(card2.getByText('High').first()).toBeVisible({ timeout: 10_000 });
    await expect(card3.getByText('Low').first()).toBeVisible({ timeout: 10_000 });

    // 5. Test Toolbar Priority Filter: Click "Urgent"
    const filterUrgentBtn = page.locator('button').filter({ hasText: /Urgent/i }).first();
    await filterUrgentBtn.click();

    // Assert: Card1 (Urgent) is visible; Card2 (High) and Card3 (Low) are hidden
    await expect(page.locator('div.group').filter({ hasText: 'Define sprint goal' })).toBeVisible();
    await expect(page.locator('div.group').filter({ hasText: 'Break down user stories' })).not.toBeVisible();
    await expect(page.locator('div.group').filter({ hasText: 'Set up project repo' })).not.toBeVisible();

    // 6. Reset Filter
    const resetFilterBtn = page.getByRole('button', { name: /Reset/i }).or(page.getByRole('button', { name: /^All/i }));
    await resetFilterBtn.first().click();

    // Assert all cards visible again
    await expect(page.locator('div.group').filter({ hasText: 'Define sprint goal' })).toBeVisible();
    await expect(page.locator('div.group').filter({ hasText: 'Break down user stories' })).toBeVisible();
    await expect(page.locator('div.group').filter({ hasText: 'Set up project repo' })).toBeVisible();

    // 7. Test Priority Sorting: High -> Low
    const sortDropdownTrigger = page.getByRole('button', { name: /Sort:/i });
    await sortDropdownTrigger.click();

    const sortHighToLow = page.getByRole('menuitem', { name: /Priority: High → Low/i });
    await sortHighToLow.click();

    // Verify sort state applied
    await expect(page.getByRole('button', { name: /Sort: Priority: High → Low/i })).toBeVisible({ timeout: 5000 });
  });

  test('4. Card Subtasks & Checklist Engine — add, complete, edit, delete, and progress sync', async ({ page }) => {
    await page.goto(createdBoardUrl);

    // 1. Open Edit Modal for "Write API spec"
    const card = page.locator('div.group').filter({ hasText: 'Write API spec' }).first();
    await card.getByRole('button', { name: /Edit task/i }).click();

    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible({ timeout: 5000 });

    // 2. Add Subtask 1
    const addSubtaskBtn = editDialog.getByRole('button', { name: /Add a subtask/i });
    if (await addSubtaskBtn.isVisible()) {
      await addSubtaskBtn.click();
    }
    const subtaskInput = editDialog.getByLabel('New subtask title');
    await subtaskInput.fill('Draft endpoints schema');
    await editDialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(editDialog.getByText('Draft endpoints schema')).toBeVisible({ timeout: 5000 });

    // Add Subtask 2 (form remains open)
    if (await addSubtaskBtn.isVisible()) {
      await addSubtaskBtn.click();
    }
    await subtaskInput.fill('Add authentication headers');
    await editDialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(editDialog.getByText('Add authentication headers')).toBeVisible({ timeout: 5000 });

    // Add Subtask 3
    if (await addSubtaskBtn.isVisible()) {
      await addSubtaskBtn.click();
    }
    await subtaskInput.fill('Review with team');
    await editDialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(editDialog.getByText('Review with team')).toBeVisible({ timeout: 5000 });

    // 3. Verify Progress calculation: 0 of 3 (0%)
    await expect(editDialog.getByText(/0 of 3 \(0%\)/i)).toBeVisible({ timeout: 5000 });

    // 4. Toggle Subtask 1 completion
    const subtask1Checkbox = editDialog.getByRole('checkbox', { name: /Mark subtask "Draft endpoints schema"/i });
    await subtask1Checkbox.click();

    // Verify Progress calculation updates: 1 of 3 (33%)
    await expect(editDialog.getByText(/1 of 3 \(33%\)/i)).toBeVisible({ timeout: 5000 });

    // 5. Inline Edit Subtask 2 title
    const subtask2Row = editDialog.locator('li').filter({ hasText: 'Add authentication headers' }).first();
    await subtask2Row.hover();
    const editSubtask2Btn = editDialog.getByRole('button', { name: /Edit subtask "Add authentication headers"/i });
    await editSubtask2Btn.click({ force: true });

    const editSubtaskInput = editDialog.getByRole('textbox', { name: 'Edit subtask title', exact: true });
    await expect(editSubtaskInput).toBeVisible({ timeout: 5000 });
    await editSubtaskInput.fill('Add JWT authorization headers');
    await editSubtaskInput.press('Enter');

    // Verify updated title is displayed
    await expect(editDialog.getByText('Add JWT authorization headers')).toBeVisible({ timeout: 10_000 });

    // 6. Delete Subtask 3
    const subtask3Row = editDialog.locator('li').filter({ hasText: 'Review with team' }).first();
    await subtask3Row.hover();
    const deleteSubtask3Btn = editDialog.getByRole('button', { name: /Delete subtask "Review with team"/i });
    await deleteSubtask3Btn.click({ force: true });
    await expect(subtask3Row).not.toBeVisible({ timeout: 5000 });

    // Verify Progress recalculation: 1 of 2 (50%)
    await expect(editDialog.getByText(/1 of 2 \(50%\)/i)).toBeVisible({ timeout: 5000 });

    // 7. Save modal and verify Subtask indicator on Kanban card
    await editDialog.getByRole('button', { name: /Save Changes/i }).click();
    await expect(editDialog).not.toBeVisible({ timeout: 10_000 });

    // Verify card displays subtask badge: 1/2
    await expect(card.getByText('1/2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('5. Recurring Tasks Engine & Cycle Advancement — recurrence rule and completion rollover', async ({ page }) => {
    await page.goto(createdBoardUrl);

    // 1. Open edit modal for "Define sprint goal"
    const card = page.locator('div.group').filter({ hasText: 'Define sprint goal' }).first();
    await card.getByRole('button', { name: /Edit task/i }).click();

    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible({ timeout: 5000 });

    // 2. Set Due Date: Today
    const todayBtn = editDialog.getByRole('button', { name: 'Today', exact: true });
    await todayBtn.click();

    // 3. Set Recurrence: "Daily"
    const dailyRecurrenceBtn = editDialog.getByRole('button', { name: 'Daily', exact: true });
    await dailyRecurrenceBtn.click();

    // Verify Recurrence preview badge in modal
    await expect(editDialog.getByText(/Repeats: Daily|Daily/i).first()).toBeVisible();

    // Save changes
    await editDialog.getByRole('button', { name: /Save Changes/i }).click();
    await expect(editDialog).not.toBeVisible({ timeout: 10_000 });

    // 4. Verify Recurrence Badge on Kanban Card
    await expect(card.getByText('Daily').first()).toBeVisible({ timeout: 10_000 });

    // 5. Complete the recurring task via checkbox
    const completeCheckbox = card.getByRole('checkbox', { name: /Mark "Define sprint goal" as complete/i });
    await completeCheckbox.click();

    // 6. Assert Toast notification for Recurring completion advancement
    await expect(page.getByText(/Recurring task completed! Next cycle due on/i).first()).toBeVisible({ timeout: 10_000 });

    // 7. Assert the card remains active (is_completed stays false) with due date advanced to tomorrow
    await expect(card.locator('p').first()).not.toHaveClass(/line-through/);
    await expect(card.getByText('Tomorrow').first()).toBeVisible({ timeout: 10_000 });
  });

  test('6. Lifecycle Cleanup — delete test board', async ({ page }) => {
    await page.goto('/list/todo');

    // Find the Sprint Board card
    const boardCard = page.locator('div.group').filter({ hasText: 'Sprint Board' }).first();
    await expect(boardCard).toBeVisible({ timeout: 10_000 });

    // Open board actions menu and delete
    await boardCard.hover();
    await boardCard.getByRole('button', { name: 'List actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    const deleteDialog = page.getByRole('alertdialog');
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole('button', { name: 'Delete' }).click();

    // Verify board card is removed
    await expect(deleteDialog).not.toBeVisible({ timeout: 10_000 });
  });
});
