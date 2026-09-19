'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserWithRateLimit } from '@/lib/auth-with-rate-limit'
import { createNotification } from '@/features/notifications'
import type { Database } from '@/types/supabase'
import type {
  ListDTO,
  ListItemDTO,
  ListType,
  ListColumnDTO,
  ListItemPriority,
  ListItemRecurrenceRule,
  ListLabelDTO,
  ListItemResourceDTO,
} from '@/types/dto'
import {
  createListSchema,
  createListItemSchema,
  listTypeSchema,
  wishlistMetadataSchema,
  addColumnActionSchema,
  listColumnIdSchema,
  listIdSchema,
  listItemIdSchema,
  createSubtaskSchema,
  updateSubtaskTitleSchema,
  toggleSubtaskSchema,
  deleteSubtaskSchema,
  reorderSubtasksSchema,
  moveItemSchema,
  moveItemToListSchema,
  reorderColumnsSchema,
  reorderItemsSchema,
  seedDefaultColumnsSchema,
  setDueDateSchema,
  setPrioritySchema,
  setRecurrenceSchema,
  toggleDoneColumnSchema,
  toggleItemSchema,
  toggleListPublicSchema,
  updateColumnSchema,
  updateItemActionSchema,
  updateListActionSchema,
  createBoardFromTemplateSchema,
  createListLabelSchema,
  deleteListLabelSchema,
  setCardLabelsSchema,
  addResourceSchema,
  deleteResourceSchema,
  setColumnWipLimitSchema,
  importBoardBatchSchema,
  claimWishlistItemSchema,
  unclaimWishlistItemSchema,
  releaseWishlistItemClaimSchema,
} from './schemas.server'
import { formatDueDateLabel } from './lib/due-date'
import {
  calculateNextRecurrenceDate,
  isListItemRecurrenceRule,
} from './lib/recurrence'
import {
  mapListToDTO,
  mapListWithSummaryToDTO,
  mapListItemToDTO,
  mapListSubtaskToDTO,
  mapListColumnToDTO,
  mapListLabelToDTO,
  mapListItemResourceToDTO,
} from '@/lib/mappers'
import { getNextAvailableLabelColorIndex } from './lib/label-colors'
import { resolveResourceMetadata } from './lib/resource-metadata'
import { DEFAULT_SORT_GAP } from './lib/fractional-indexing'
import type { ParsedImportCard } from './lib/board-importer'
import { BOARD_TEMPLATES } from './templates'
import { generateUniqueListSlug } from './lib/slug'

/** Sentinel title for the per-user hidden "New Idea" list */
const NEW_IDEA_LIST_TITLE = '__new_idea__'

type ServerSupabaseClient = SupabaseClient<Database>

type OwnedList = {
  id: string
  type: ListType
}

type OwnedItem = {
  id: string
  listId: string
  listType: ListType
}

type OwnedColumn = {
  id: string
  listId: string
  isDoneColumn: boolean
}

async function getOwnedList(
  supabase: ServerSupabaseClient,
  userId: string,
  listId: string,
): Promise<OwnedList | null> {
  const { data, error } = await supabase
    .from('lists')
    .select('id, type')
    .eq('id', listId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    type: listTypeSchema.catch('todo').parse(data.type),
  }
}

async function getOwnedItem(
  supabase: ServerSupabaseClient,
  userId: string,
  itemId: string,
): Promise<OwnedItem | null> {
  const { data, error } = await supabase
    .from('list_items')
    .select('id, list_id, lists!inner(id, type, user_id)')
    .eq('id', itemId)
    .eq('lists.user_id', userId)
    .maybeSingle()

  if (error || !data) return null

  let listType: ListType | null = null
  if (
    'lists' in data &&
    data.lists &&
    typeof data.lists === 'object' &&
    'type' in data.lists &&
    typeof data.lists.type === 'string'
  ) {
    listType = listTypeSchema.catch('todo').parse(data.lists.type)
  } else {
    const list = await getOwnedList(supabase, userId, data.list_id)
    if (list) listType = list.type
  }

  if (!listType) return null

  return {
    id: data.id,
    listId: data.list_id,
    listType,
  }
}

async function getOwnedColumn(
  supabase: ServerSupabaseClient,
  userId: string,
  columnId: string,
): Promise<OwnedColumn | null> {
  const { data, error } = await supabase
    .from('list_columns')
    .select('id, list_id, is_done_column, lists!inner(id, user_id)')
    .eq('id', columnId)
    .eq('lists.user_id', userId)
    .maybeSingle()

  if (error || !data) return null

  let hasList = false
  if ('lists' in data && data.lists && typeof data.lists === 'object') {
    hasList = true
  } else {
    const list = await getOwnedList(supabase, userId, data.list_id)
    if (list) hasList = true
  }

  if (!hasList) return null

  return {
    id: data.id,
    listId: data.list_id,
    isDoneColumn: data.is_done_column,
  }
}

type OwnedSubtask = {
  id: string
  itemId: string
  listId: string
  listType: ListType
}

async function getOwnedSubtask(
  supabase: ServerSupabaseClient,
  userId: string,
  subtaskId: string,
): Promise<OwnedSubtask | null> {
  const { data: subtask, error: subtaskError } = await supabase
    .from('list_subtasks')
    .select('id, item_id')
    .eq('id', subtaskId)
    .maybeSingle()

  if (subtaskError || !subtask) return null

  const ownedItem = await getOwnedItem(supabase, userId, subtask.item_id)
  if (!ownedItem) return null

  return {
    id: subtask.id,
    itemId: subtask.item_id,
    listId: ownedItem.listId,
    listType: ownedItem.listType,
  }
}

async function allItemsBelongToList(
  supabase: ServerSupabaseClient,
  listId: string,
  itemIds: string[],
): Promise<boolean> {
  if (new Set(itemIds).size !== itemIds.length) return false

  const { data, error } = await supabase
    .from('list_items')
    .select('id')
    .eq('list_id', listId)
    .in('id', itemIds)

  return !error && data?.length === itemIds.length
}

async function allColumnsBelongToList(
  supabase: ServerSupabaseClient,
  listId: string,
  columnIds: string[],
): Promise<boolean> {
  if (new Set(columnIds).size !== columnIds.length) return false

  const { data, error } = await supabase
    .from('list_columns')
    .select('id')
    .eq('list_id', listId)
    .in('id', columnIds)

  return !error && data?.length === columnIds.length
}

// ==========================================
// LIST-LEVEL ACTIONS
// ==========================================

export async function createList(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserWithRateLimit()

  const payload = {
    title: String(formData.get('title') || ''),
    type: String(formData.get('type') || ''),
    description: formData.get('description')
      ? String(formData.get('description'))
      : undefined,
  }

  const parsed = createListSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const slug = await generateUniqueListSlug(supabase, user.id, parsed.data.title)

  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      type: parsed.data.type,
      description: parsed.data.description || null,
      is_public: false,
      slug,
    })
    .select()
    .single()

  if (error || !data) {
    return { error: 'Failed to create list' }
  }

  const listDto: ListDTO = {
    id: data.id,
    title: data.title,
    description: data.description,
    type: listTypeSchema.catch('todo').parse(data.type),
    is_public: data.is_public,
    slug: data.slug,
    user_id: data.user_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    item_count: 0,
    completed_count: 0,
  }

  revalidatePath('/list')
  return { success: true, data: listDto }
}

export async function updateList(listId: string, formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserWithRateLimit()

  const payload = {
    title: String(formData.get('title') || ''),
    description: formData.get('description')
      ? String(formData.get('description'))
      : undefined,
  }

  const parsed = updateListActionSchema.safeParse({ ...payload, listId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) return { error: 'List not found' }

  const { error } = await supabase
    .from('lists')
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
    })
    .eq('id', parsed.data.listId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update list' }
  }

  revalidatePath('/list')
  return { success: true }
}

export async function deleteList(listId: string) {
  const parsed = listIdSchema.safeParse(listId)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedList = await getOwnedList(supabase, user.id, parsed.data)
  if (!ownedList) return { error: 'List not found' }

  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', parsed.data)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete list' }
  }

  revalidatePath('/list')
  return { success: true }
}

export async function toggleListPublic(listId: string, isPublic: boolean) {
  const parsed = toggleListPublicSchema.safeParse({ listId, isPublic })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) return { error: 'List not found' }

  const { data: currentList } = await supabase
    .from('lists')
    .select('title, slug')
    .eq('id', parsed.data.listId)
    .single()

  let listSlug = currentList?.slug
  if (parsed.data.isPublic && !listSlug && currentList?.title) {
    listSlug = await generateUniqueListSlug(supabase, user.id, currentList.title, parsed.data.listId)
  }

  const { error } = await supabase
    .from('lists')
    .update({
      is_public: parsed.data.isPublic,
      ...(listSlug ? { slug: listSlug } : {}),
    })
    .eq('id', parsed.data.listId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update list visibility' }
  }

  revalidatePath('/list')
  revalidatePath(`/list/wishlist/${parsed.data.listId}`)
  revalidatePath('/list/wishlist')
  return { success: true, isPublic: parsed.data.isPublic, slug: listSlug }
}

// ==========================================
// ITEM-LEVEL ACTIONS
// ==========================================

export async function addItem(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserWithRateLimit()

  const listId = String(formData.get('listId') || '')
  const rawDueDate = formData.get('dueDate') ?? formData.get('due_date')
  const rawPriority = formData.get('priority')
  const rawRecurrence = formData.get('recurrenceRule') ?? formData.get('recurrence_rule')

  const payload = {
    listId,
    title: String(formData.get('title') || ''),
    description: formData.get('description')
      ? String(formData.get('description'))
      : undefined,
    columnId: formData.get('columnId')
      ? String(formData.get('columnId'))
      : undefined,
    dueDate:
      rawDueDate !== null &&
      rawDueDate !== undefined &&
      String(rawDueDate).trim() !== ''
        ? String(rawDueDate).trim()
        : null,
    priority:
      rawPriority !== null &&
      rawPriority !== undefined &&
      String(rawPriority).trim() !== ''
        ? String(rawPriority).trim()
        : null,
    recurrenceRule:
      rawRecurrence !== null &&
      rawRecurrence !== undefined &&
      String(rawRecurrence).trim() !== ''
        ? String(rawRecurrence).trim()
        : null,
  }

  const parsed = createListItemSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) return { error: 'List not found' }

  if (parsed.data.columnId) {
    const ownedColumn = await getOwnedColumn(
      supabase,
      user.id,
      parsed.data.columnId,
    )
    if (!ownedColumn || ownedColumn.listId !== parsed.data.listId) {
      return { error: 'Column not found' }
    }
  }

  const { data: itemsData } = await supabase
  .from('list_items')
  .select('sort_order')
  .eq('list_id', parsed.data.listId)
  .order('sort_order', { ascending: false })
  .limit(1)

  const nextSortOrder =
    itemsData && itemsData.length > 0 ? itemsData[0].sort_order + 1024 : 1024

  let metadata = null
  if (ownedList.type === 'wishlist') {
    const metaPayload = {
      price: formData.get('price'),
      currency: formData.get('currency'),
      purchase_url: formData.get('purchase_url'),
    }
    const metaParsed = wishlistMetadataSchema.safeParse(metaPayload)
    if (metaParsed.success) {
      metadata = metaParsed.data
    }
  }

  const { data, error } = await supabase
    .from('list_items')
    .insert({
      list_id: parsed.data.listId,
      column_id: parsed.data.columnId || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_date: parsed.data.dueDate || null,
      priority: parsed.data.priority || null,
      recurrence_rule: parsed.data.recurrenceRule || null,
      reminder_sent: false,
      sort_order: nextSortOrder,
      metadata,
    })
    .select()
    .single()

  if (error || !data) {
    return { error: 'Failed to add item' }
  }

  revalidatePath('/list')
  return { success: true, data: mapListItemToDTO(data) }
}

export async function updateItem(itemId: string, formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserWithRateLimit()

  const rawDueDate = formData.get('dueDate') ?? formData.get('due_date')
  const rawPriority = formData.get('priority')
  const rawRecurrence = formData.get('recurrenceRule') ?? formData.get('recurrence_rule')
  const payload: {
    title: string
    description?: string
    dueDate?: string | null
    priority?: string | null
    recurrenceRule?: string | null
  } = {
    title: String(formData.get('title') || ''),
    description: formData.get('description')
      ? String(formData.get('description'))
      : undefined,
  }
  if (rawDueDate !== null && rawDueDate !== undefined) {
    payload.dueDate =
      String(rawDueDate).trim() !== '' ? String(rawDueDate).trim() : null
  }
  if (rawPriority !== null && rawPriority !== undefined) {
    payload.priority =
      String(rawPriority).trim() !== '' ? String(rawPriority).trim() : null
  }
  if (rawRecurrence !== null && rawRecurrence !== undefined) {
    payload.recurrenceRule =
      String(rawRecurrence).trim() !== '' ? String(rawRecurrence).trim() : null
  }

  const parsed = updateItemActionSchema.safeParse({ ...payload, itemId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  if (!ownedItem) return { error: 'Item not found' }

  let metadata: { [key: string]: unknown } | null | undefined = undefined
  if (ownedItem.listType === 'wishlist') {
    const metaPayload = {
      price: formData.get('price'),
      currency: formData.get('currency'),
      purchase_url: formData.get('purchase_url'),
    }
    const metaParsed = wishlistMetadataSchema.safeParse(metaPayload)
    if (metaParsed.success) {
      const { data: currentItem } = await supabase
        .from('list_items')
        .select('metadata')
        .eq('id', parsed.data.itemId)
        .maybeSingle()

      const existingMeta: Record<string, unknown> = {}
      if (
        typeof currentItem?.metadata === 'object' &&
        currentItem.metadata !== null &&
        !Array.isArray(currentItem.metadata)
      ) {
        for (const [k, v] of Object.entries(currentItem.metadata)) {
          existingMeta[k] = v
        }
      }

      metadata = {
        ...existingMeta,
        ...metaParsed.data,
      }
    }
  }

  const updatePayload: Record<string, unknown> = {
    title: parsed.data.title,
    description: parsed.data.description || null,
  }
  if (parsed.data.dueDate !== undefined) {
    updatePayload.due_date = parsed.data.dueDate || null
    updatePayload.reminder_sent = false
  }
  if (parsed.data.priority !== undefined) {
    updatePayload.priority = parsed.data.priority || null
  }
  if (parsed.data.recurrenceRule !== undefined) {
    updatePayload.recurrence_rule = parsed.data.recurrenceRule || null
  }
  if (metadata !== undefined) {
    updatePayload.metadata = metadata
  }

  const { error } = await supabase
    .from('list_items')
    .update(updatePayload)
    .eq('id', parsed.data.itemId)
    .eq('list_id', ownedItem.listId)

  if (error) {
    return { error: 'Failed to update item' }
  }

  revalidatePath('/list')
  return { success: true }
}

export async function setCardDueDate(itemId: string, dueDate: string | null) {
  const parsed = setDueDateSchema.safeParse({ itemId, dueDate })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  if (!ownedItem) return { error: 'Item not found' }

  const normalizedDueDate = parsed.data.dueDate ? parsed.data.dueDate : null

  const { error } = await supabase
    .from('list_items')
    .update({
      due_date: normalizedDueDate,
      reminder_sent: false,
    })
    .eq('id', parsed.data.itemId)
    .eq('list_id', ownedItem.listId)

  if (error) {
    return { error: 'Failed to update due date' }
  }

  revalidatePath('/list')
  return { success: true }
}

export async function setCardPriority(
  itemId: string,
  priority: ListItemPriority | string | null,
) {
  const parsed = setPrioritySchema.safeParse({ itemId, priority })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  if (!ownedItem) return { error: 'Item not found' }

  const normalizedPriority = parsed.data.priority ? parsed.data.priority : null

  const { error } = await supabase
    .from('list_items')
    .update({
      priority: normalizedPriority,
    })
    .eq('id', parsed.data.itemId)
    .eq('list_id', ownedItem.listId)

  if (error) {
    return { error: 'Failed to update priority' }
  }

  revalidatePath('/list')
  return { success: true }
}

export async function setCardRecurrence(
  itemId: string,
  recurrenceRule: ListItemRecurrenceRule | string | null,
) {
  const parsed = setRecurrenceSchema.safeParse({ itemId, recurrenceRule })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  if (!ownedItem) return { error: 'Item not found' }

  const normalizedRecurrence = parsed.data.recurrenceRule ? parsed.data.recurrenceRule : null

  const { error } = await supabase
    .from('list_items')
    .update({
      recurrence_rule: normalizedRecurrence,
    })
    .eq('id', parsed.data.itemId)
    .eq('list_id', ownedItem.listId)

  if (error) {
    return { error: 'Failed to update recurrence rule' }
  }

  revalidatePath('/list')
  return { success: true }
}

/**
 * Scans uncompleted list items due today or overdue with unsent reminders,
 * dispatches notifications to list owners, and marks reminder_sent = true.
 */
export async function processTaskDueReminders(): Promise<{
  processedCount: number
  successCount: number
  errorCount: number
}> {
  const supabase = createAdminClient()
  const todayIso = new Date().toISOString().split('T')[0]

  const { data: dueItems, error } = await supabase
    .from('list_items')
    .select('id, title, due_date, list_id, lists!inner(id, user_id, title, type)')
    .eq('is_completed', false)
    .eq('reminder_sent', false)
    .not('due_date', 'is', null)
    .lte('due_date', todayIso)

  if (error || !dueItems || dueItems.length === 0) {
    return { processedCount: 0, successCount: 0, errorCount: 0 }
  }

  let successCount = 0
  let errorCount = 0
  const processedItemIds: string[] = []

  for (const item of dueItems) {
    const listOwner = Array.isArray(item.lists) ? item.lists[0] : item.lists
    if (!listOwner || !listOwner.user_id) {
      errorCount++
      continue
    }

    const isOverdue = item.due_date && item.due_date < todayIso
    const title = isOverdue ? 'Task overdue reminder' : 'Task due reminder'
    const dueLabel = formatDueDateLabel(item.due_date, false)
    const timingText = isOverdue
      ? dueLabel
        ? dueLabel.toLowerCase()
        : 'overdue'
      : 'due today'
    const body = `Task "${item.title}" in list "${listOwner.title}" is ${timingText}.`
    const listType =
      'type' in listOwner && typeof listOwner.type === 'string'
        ? listOwner.type
        : 'todo'
    const segment =
      listType === 'wishlist' ? 'wishlist' : listType === 'idea' ? 'ideas' : 'todo'
    const linkUrl = `/list/${segment}/${item.list_id}`

    const notifyResult = await createNotification({
      userId: listOwner.user_id,
      type: 'task_reminder',
      title,
      body,
      linkUrl,
    })

    if (notifyResult.success) {
      successCount++
      processedItemIds.push(item.id)
    } else {
      errorCount++
    }
  }

  if (processedItemIds.length > 0) {
    await supabase
      .from('list_items')
      .update({ reminder_sent: true })
      .in('id', processedItemIds)
  }

  return {
    processedCount: dueItems.length,
    successCount,
    errorCount,
  }
}

export async function toggleItem(itemId: string, isCompleted: boolean) {
  const parsed = toggleItemSchema.safeParse({ itemId, isCompleted })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  if (!ownedItem) return { error: 'Item not found' }

  // If completing a task, check if it has a recurrence rule
  if (parsed.data.isCompleted) {
    const { data: itemData, error: itemError } = await supabase
      .from('list_items')
      .select('id, due_date, recurrence_rule')
      .eq('id', parsed.data.itemId)
      .eq('list_id', ownedItem.listId)
      .single()

    if (!itemError && itemData?.recurrence_rule && isListItemRecurrenceRule(itemData.recurrence_rule)) {
      const nextDueDate = calculateNextRecurrenceDate(itemData.due_date, itemData.recurrence_rule)

      // Advance card: new due_date, reset reminder_sent, keep is_completed = false
      const { error: updateError } = await supabase
        .from('list_items')
        .update({
          due_date: nextDueDate,
          reminder_sent: false,
          is_completed: false,
        })
        .eq('id', parsed.data.itemId)
        .eq('list_id', ownedItem.listId)

      if (updateError) {
        return { error: 'Failed to advance recurring task' }
      }

      // Reset all subtask checklist items under this card
      await supabase
        .from('list_subtasks')
        .update({ is_completed: false })
        .eq('item_id', parsed.data.itemId)

      revalidatePath('/list')
      return {
        success: true,
        recurringAdvanced: true,
        nextDueDate,
      }
    }
  }

  const { error } = await supabase
    .from('list_items')
    .update({ is_completed: parsed.data.isCompleted })
    .eq('id', parsed.data.itemId)
    .eq('list_id', ownedItem.listId)

  if (error) {
    return { error: 'Failed to toggle item' }
  }

  revalidatePath('/list')
  return { success: true }
}

export async function deleteItem(itemId: string) {
  const parsed = listItemIdSchema.safeParse(itemId)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data)
  if (!ownedItem) return { error: 'Item not found' }

  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('id', parsed.data)
    .eq('list_id', ownedItem.listId)

  if (error) {
    return { error: 'Failed to delete item' }
  }

  revalidatePath('/list')
  return { success: true }
}

export async function reorderItems(listId: string, itemIds: string[]) {
  const parsed = reorderItemsSchema.safeParse({ listId, itemIds })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) return { error: 'List not found' }

  const itemsBelongToList = await allItemsBelongToList(
    supabase,
    parsed.data.listId,
    parsed.data.itemIds,
  )
  if (!itemsBelongToList) return { error: 'Invalid item selection' }

  const { error } = await supabase.rpc('reorder_list_items', {
    p_item_ids: parsed.data.itemIds,
  })
  if (error) return { error: 'Failed to reorder items' }

  revalidatePath('/list')
  return { success: true }
}

export async function moveItem(
  itemId: string,
  columnId: string,
  sortOrder: number,
  isDoneColumn: boolean,
) {
  const parsed = moveItemSchema.safeParse({
    itemId,
    columnId,
    sortOrder,
    isDoneColumn,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  const ownedColumn = await getOwnedColumn(
    supabase,
    user.id,
    parsed.data.columnId,
  )

  if (!ownedItem || !ownedColumn || ownedColumn.listId !== ownedItem.listId) {
    return { error: 'Item or column not found' }
  }

  // Fetch current item state from DB to check if column is actually changing
  const { data: itemData } = await supabase
    .from('list_items')
    .select('id, column_id, due_date, recurrence_rule, is_completed')
    .eq('id', parsed.data.itemId)
    .eq('list_id', ownedItem.listId)
    .single()

  const isChangingColumn = itemData ? itemData.column_id !== parsed.data.columnId : true
  const isEnteringDoneColumn = isChangingColumn && ownedColumn.isDoneColumn

  // If moving into a done column from a different column, check if card is recurring
  if (isEnteringDoneColumn && itemData?.recurrence_rule && isListItemRecurrenceRule(itemData.recurrence_rule)) {
    const nextDueDate = calculateNextRecurrenceDate(itemData.due_date, itemData.recurrence_rule)

    // Find the starter (first non-done) column on this board
    const { data: boardColumns } = await supabase
      .from('list_columns')
      .select('id, is_done_column, sort_order')
      .eq('list_id', ownedItem.listId)
      .order('sort_order', { ascending: true })

    const starterColumn = boardColumns?.find((c) => !c.is_done_column) ?? boardColumns?.[0] ?? ownedColumn
    const targetReturnColumnId = starterColumn.id

    const { error } = await supabase
      .from('list_items')
      .update({
        column_id: targetReturnColumnId,
        sort_order: parsed.data.sortOrder,
        due_date: nextDueDate,
        reminder_sent: false,
        is_completed: false,
      })
      .eq('id', parsed.data.itemId)
      .eq('list_id', ownedItem.listId)

    if (error) {
      return { error: 'Failed to move item' }
    }

    // Reset all subtask checklist items under this card
    await supabase
      .from('list_subtasks')
      .update({ is_completed: false })
      .eq('item_id', parsed.data.itemId)

    revalidatePath('/list')
    return {
      success: true,
      recurringAdvanced: true,
      nextDueDate,
      targetColumnId: targetReturnColumnId,
    }
  }

  const updatePayload: {
    column_id: string
    sort_order: number
    is_completed?: boolean
  } = {
    column_id: parsed.data.columnId,
    sort_order: parsed.data.sortOrder,
  }

  // Only auto-mark completed when transitioning into a done column from another column
  if (isEnteringDoneColumn) {
    updatePayload.is_completed = true
  }

  const { error } = await supabase
    .from('list_items')
    .update(updatePayload)
    .eq('id', parsed.data.itemId)
    .eq('list_id', ownedItem.listId)

  if (error) {
    return { error: 'Failed to move item' }
  }

  revalidatePath('/list')
  return { success: true }
}

// ==========================================
// QUERY HELPERS (for server components)
// ==========================================

export async function getListsByType(type: ListType): Promise<ListDTO[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('list_summaries')
    .select('*')
    .eq('type', type)
    .neq('title', NEW_IDEA_LIST_TITLE)
    .order('updated_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapListWithSummaryToDTO)
}

export async function getListCounts(): Promise<Record<ListType, number>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lists')
    .select('type')
    .neq('title', NEW_IDEA_LIST_TITLE)

  const counts: Record<ListType, number> = { todo: 0, wishlist: 0, idea: 0 }
  if (!error && data) {
    data.forEach((l) => {
      const type = listTypeSchema.catch('todo').parse(l.type)
      counts[type]++
    })
  }
  return counts
}

export async function getListById(listId: string): Promise<ListDTO | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('list_summaries')
    .select('*')
    .eq('id', listId)
    .single()

  if (error || !data) return null
  return mapListWithSummaryToDTO(data)
}

export async function getItemsByListId(listId: string): Promise<ListItemDTO[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('list_items')
    .select('*, list_subtasks(*), list_item_resources(*)')
    .eq('list_id', listId)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data.map(mapListItemToDTO)
}

// ==========================================
// IDEA "NEW IDEA" LIST (standalone items)
// ==========================================

/** Find or create the hidden "New Idea" list for standalone ideas */
export async function getOrCreateNewIdeaList(): Promise<ListDTO | null> {
  const { supabase, user } = await getAuthenticatedUserWithRateLimit()

  const { data: lists, error: selectError } = await supabase
    .from('lists')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'idea')
    .eq('title', NEW_IDEA_LIST_TITLE)
    .order('created_at', { ascending: true })

  if (selectError) return null

  if (lists && lists.length > 0) {
    const primaryList = lists[0]

    // If duplicate new idea lists exist, migrate items to primary list and clean up duplicates
    if (lists.length > 1) {
      const duplicateIds = lists.slice(1).map((l) => l.id)

      await supabase
        .from('list_items')
        .update({ list_id: primaryList.id })
        .in('list_id', duplicateIds)

      await supabase.from('lists').delete().in('id', duplicateIds)
    }

    return mapListToDTO(primaryList)
  }

  const { data: created, error } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      title: NEW_IDEA_LIST_TITLE,
      type: 'idea',
      is_public: false,
    })
    .select()
    .single()

  if (error || !created) return null
  return mapListToDTO(created)
}

/** Fetch items in the user's "New Idea" list */
export async function getNewIdeaItems(): Promise<ListItemDTO[]> {
  const newIdeaList = await getOrCreateNewIdeaList()
  if (!newIdeaList) return []
  return getItemsByListId(newIdeaList.id)
}

/** Move an item from one list to another */
export async function moveItemToList(itemId: string, targetListId: string) {
  const parsed = moveItemToListSchema.safeParse({ itemId, targetListId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  const ownedTargetList = await getOwnedList(
    supabase,
    user.id,
    parsed.data.targetListId,
  )
  if (!ownedItem || !ownedTargetList) return { error: 'Item or list not found' }

  const { error } = await supabase
    .from('list_items')
    .update({ list_id: parsed.data.targetListId, column_id: null })
    .eq('id', parsed.data.itemId)
    .eq('list_id', ownedItem.listId)

  if (error) {
    return { error: 'Failed to move item' }
  }

  revalidatePath('/list')
  return { success: true }
}

// ==========================================
// COLUMN ACTIONS — Kanban column management
// ==========================================

const DEFAULT_COLUMNS = [
  { title: 'Todo', sort_order: 0, is_done_column: false },
  { title: 'In Progress', sort_order: 1024, is_done_column: false },
  { title: 'Review', sort_order: 2048, is_done_column: false },
  { title: 'Completed', sort_order: 3072, is_done_column: true },
]

export async function seedDefaultColumns(
  listId: string,
): Promise<ListColumnDTO[]> {
  const parsed = seedDefaultColumnsSchema.safeParse({ listId })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Invalid input')
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) throw new Error('List not found')

  const columnsToInsert = DEFAULT_COLUMNS.map((col) => ({
    list_id: parsed.data.listId,
    title: col.title,
    sort_order: col.sort_order,
    is_done_column: col.is_done_column,
  }))

  const { data, error } = await supabase
    .from('list_columns')
    .insert(columnsToInsert)
    .select()

  if (error || !data) {
    throw new Error('Failed to seed columns')
  }

  return data.map(mapListColumnToDTO)
}

export async function getColumnsByListId(
  listId: string,
): Promise<ListColumnDTO[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('list_columns')
    .select('*')
    .eq('list_id', listId)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data.map(mapListColumnToDTO)
}

export async function addColumn(listId: string, title: string) {
  const parsed = addColumnActionSchema.safeParse({ listId, title })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid column title' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) return { error: 'List not found' }

  const { data: cols } = await supabase
    .from('list_columns')
    .select('sort_order')
    .eq('list_id', parsed.data.listId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = cols && cols.length > 0 ? cols[0].sort_order + 1024 : 1024

  const { data, error } = await supabase
    .from('list_columns')
    .insert({
      list_id: parsed.data.listId,
      title: parsed.data.title,
      sort_order: nextOrder,
      is_done_column: false,
    })
    .select()
    .single()

  if (error || !data) {
    return { error: 'Failed to add column' }
  }

  revalidatePath('/list')
  return { success: true, data: mapListColumnToDTO(data) }
}

export async function updateColumn(columnId: string, title: string) {
  const parsed = updateColumnSchema.safeParse({ columnId, title })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid column title' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedColumn = await getOwnedColumn(
    supabase,
    user.id,
    parsed.data.columnId,
  )
  if (!ownedColumn) return { error: 'Column not found' }

  const { error } = await supabase
    .from('list_columns')
    .update({ title: parsed.data.title })
    .eq('id', parsed.data.columnId)
    .eq('list_id', ownedColumn.listId)

  if (error) {
    return { error: 'Failed to update column' }
  }

  revalidatePath('/list')
  return { success: true }
}

export async function deleteColumn(columnId: string) {
  const parsed = listColumnIdSchema.safeParse(columnId)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedColumn = await getOwnedColumn(supabase, user.id, parsed.data)
  if (!ownedColumn) return { error: 'Column not found' }

  // Validate it's not the last column
  const { count } = await supabase
    .from('list_columns')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', ownedColumn.listId)
  if (count !== null && count <= 1) {
    return { error: 'Cannot delete the last column' }
  }

  const { error } = await supabase
    .from('list_columns')
    .delete()
    .eq('id', parsed.data)
    .eq('list_id', ownedColumn.listId)

  if (error) {
    return { error: 'Failed to delete column' }
  }

  revalidatePath('/list')
  return { success: true }
}

export async function reorderColumns(listId: string, columnIds: string[]) {
  const parsed = reorderColumnsSchema.safeParse({ listId, columnIds })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) return { error: 'List not found' }

  const columnsBelongToList = await allColumnsBelongToList(
    supabase,
    parsed.data.listId,
    parsed.data.columnIds,
  )
  if (!columnsBelongToList) return { error: 'Invalid column selection' }

  const { error } = await supabase.rpc('reorder_list_columns', {
    p_column_ids: parsed.data.columnIds,
  })
  if (error) return { error: 'Failed to reorder columns' }

  revalidatePath('/list')
  return { success: true }
}

export async function toggleDoneColumn(
  columnId: string,
  isDoneColumn: boolean,
) {
  const parsed = toggleDoneColumnSchema.safeParse({ columnId, isDoneColumn })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedColumn = await getOwnedColumn(
    supabase,
    user.id,
    parsed.data.columnId,
  )
  if (!ownedColumn) return { error: 'Column not found' }

  const { error } = await supabase
    .from('list_columns')
    .update({ is_done_column: parsed.data.isDoneColumn })
    .eq('id', parsed.data.columnId)
    .eq('list_id', ownedColumn.listId)

  if (error) {
    return { error: 'Failed to update column' }
  }

  revalidatePath('/list')
  return { success: true }
}

// ==========================================
// SUBTASK ACTIONS — Checklist & subtask engine
// ==========================================

export async function createSubtask(itemId: string, title: string) {
  const parsed = createSubtaskSchema.safeParse({ itemId, title })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  if (!ownedItem) return { error: 'Task not found' }

  // Get current max position for ordering
  const { data: maxRow } = await supabase
    .from('list_subtasks')
    .select('position')
    .eq('item_id', parsed.data.itemId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPosition = (maxRow?.position ?? -1) + 1

  const { data: created, error } = await supabase
    .from('list_subtasks')
    .insert({
      item_id: parsed.data.itemId,
      title: parsed.data.title,
      is_completed: false,
      position: nextPosition,
    })
    .select()
    .single()

  if (error || !created) {
    return { error: 'Failed to create subtask' }
  }

  revalidatePath(`/list/${ownedItem.listType}/${ownedItem.listId}`)
  revalidatePath('/list')
  return { success: true, data: mapListSubtaskToDTO(created) }
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  const parsed = toggleSubtaskSchema.safeParse({ subtaskId, isCompleted })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedSubtask = await getOwnedSubtask(supabase, user.id, parsed.data.subtaskId)
  if (!ownedSubtask) return { error: 'Subtask not found' }

  const { error } = await supabase
    .from('list_subtasks')
    .update({ is_completed: parsed.data.isCompleted })
    .eq('id', parsed.data.subtaskId)

  if (error) {
    return { error: 'Failed to update subtask' }
  }

  revalidatePath(`/list/${ownedSubtask.listType}/${ownedSubtask.listId}`)
  revalidatePath('/list')
  return { success: true }
}

export async function updateSubtaskTitle(subtaskId: string, title: string) {
  const parsed = updateSubtaskTitleSchema.safeParse({ subtaskId, title })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedSubtask = await getOwnedSubtask(supabase, user.id, parsed.data.subtaskId)
  if (!ownedSubtask) return { error: 'Subtask not found' }

  const { error } = await supabase
    .from('list_subtasks')
    .update({ title: parsed.data.title })
    .eq('id', parsed.data.subtaskId)

  if (error) {
    return { error: 'Failed to update subtask title' }
  }

  revalidatePath(`/list/${ownedSubtask.listType}/${ownedSubtask.listId}`)
  revalidatePath('/list')
  return { success: true }
}

export async function deleteSubtask(subtaskId: string) {
  const parsed = deleteSubtaskSchema.safeParse({ subtaskId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedSubtask = await getOwnedSubtask(supabase, user.id, parsed.data.subtaskId)
  if (!ownedSubtask) return { error: 'Subtask not found' }

  const { error } = await supabase
    .from('list_subtasks')
    .delete()
    .eq('id', parsed.data.subtaskId)

  if (error) {
    return { error: 'Failed to delete subtask' }
  }

  revalidatePath(`/list/${ownedSubtask.listType}/${ownedSubtask.listId}`)
  revalidatePath('/list')
  return { success: true }
}

export async function reorderSubtasks(itemId: string, subtaskIds: string[]) {
  const parsed = reorderSubtasksSchema.safeParse({ itemId, subtaskIds })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  if (!ownedItem) return { error: 'Task not found' }

  // Verify all subtasks belong to this item
  const { data: existing, error: selectError } = await supabase
    .from('list_subtasks')
    .select('id')
    .eq('item_id', parsed.data.itemId)
    .in('id', parsed.data.subtaskIds)

  if (selectError || !existing || existing.length !== parsed.data.subtaskIds.length) {
    return { error: 'Invalid subtasks selection' }
  }

  const updates = parsed.data.subtaskIds.map((id, index) =>
    supabase
      .from('list_subtasks')
      .update({ position: index })
      .eq('id', id)
      .eq('item_id', parsed.data.itemId),
  )

  await Promise.all(updates)

  revalidatePath(`/list/${ownedItem.listType}/${ownedItem.listId}`)
  return { success: true }
}


// TEMPLATE ACTIONS — Board creation from pre-built templates
// ===========================================================

export async function createBoardFromTemplate(templateId: string) {
  const parsed = createBoardFromTemplateSchema.safeParse({ templateId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid template' }
  }

  const template = BOARD_TEMPLATES.find((t) => t.id === parsed.data.templateId)
  if (!template) return { error: 'Template not found' }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()

  // 1. Create the list
  const { data: list, error: listError } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      title: template.name,
      type: 'todo',
      description: template.description,
      is_public: false,
    })
    .select('id')
    .single()

  if (listError || !list) {
    return { error: 'Failed to create board' }
  }

  const listId = list.id

  // 2. Insert columns
  const { data: columns, error: colError } = await supabase
    .from('list_columns')
    .insert(
      template.columns.map((col, index) => ({
        list_id: listId,
        title: col.title,
        sort_order: index * 1024,
        is_done_column: col.is_done_column,
      }))
    )
    .select('id, sort_order')

  if (colError || !columns || columns.length === 0) {
    return { error: 'Failed to create columns' }
  }

  // Sort by sort_order to map starterCards by columnIndex reliably
  const sortedColumns = [...columns].sort((a, b) => a.sort_order - b.sort_order)

  // 3. Insert starter cards
  const validStarterCards = template.starterCards.filter(
    (c) => c.columnIndex < sortedColumns.length,
  )
  const cardsToInsert = validStarterCards.map((c, idx) => ({
    list_id: listId,
    column_id: sortedColumns[c.columnIndex].id,
    title: c.title,
    sort_order: idx * 1024,
    is_completed: false,
  }))

  if (cardsToInsert.length > 0) {
    const { data: insertedCards } = await supabase
      .from('list_items')
      .insert(cardsToInsert)
      .select('id')

    // 4. Insert subtasks — match by index (Supabase preserves insert order)
    if (insertedCards && insertedCards.length > 0) {
      const subtasksToInsert = validStarterCards.flatMap((card, idx) => {
        if (!card.subtasks || card.subtasks.length === 0) return []
        const insertedCard = insertedCards[idx]
        if (!insertedCard) return []
        return card.subtasks.map((title, position) => ({
          item_id: insertedCard.id,
          title,
          position,
          is_completed: false,
        }))
      })

      if (subtasksToInsert.length > 0) {
        await supabase.from('list_subtasks').insert(subtasksToInsert)
      }
    }
  }

  revalidatePath('/list')
  return { success: true, data: { listId } }
}

// ==========================================
// WEEK 3: LABELS, RESOURCES, WIP & IMPORTER
// ==========================================

export async function getListLabels(listId: string): Promise<ListLabelDTO[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('list_labels')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data.map(mapListLabelToDTO)
}

export async function createListLabel(
  listId: string,
  name: string,
  colorIndex?: number,
) {
  const parsed = createListLabelSchema.safeParse({ listId, name, colorIndex })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) return { error: 'List not found' }

  // Check label limit: maximum 50 custom labels per list
  const { count: labelCount, error: labelCountErr } = await supabase
    .from('list_labels')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', parsed.data.listId)

  if (labelCountErr) return { error: 'Failed to verify label limit' }
  if ((labelCount ?? 0) >= 50) {
    return { error: 'Maximum limit of 50 custom labels reached for this list' }
  }

  let assignedColor = parsed.data.colorIndex
  if (typeof assignedColor !== 'number') {
    const { data: existing } = await supabase
      .from('list_labels')
      .select('color_index')
      .eq('list_id', parsed.data.listId)
    assignedColor = getNextAvailableLabelColorIndex(existing || [])
  }

  const { data, error } = await supabase
    .from('list_labels')
    .insert({
      list_id: parsed.data.listId,
      name: parsed.data.name,
      color_index: assignedColor,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A label with this name already exists' }
    }
    return { error: 'Failed to create label' }
  }

  revalidatePath(`/list/todo/${parsed.data.listId}`)
  return { success: true, data: mapListLabelToDTO(data) }
}

export async function deleteListLabel(listId: string, labelId: string) {
  const parsed = deleteListLabelSchema.safeParse({ listId, labelId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) return { error: 'List not found' }

  const { error } = await supabase
    .from('list_labels')
    .delete()
    .eq('id', parsed.data.labelId)
    .eq('list_id', parsed.data.listId)

  if (error) return { error: 'Failed to delete label' }

  revalidatePath(`/list/todo/${parsed.data.listId}`)
  return { success: true }
}

export async function setCardLabels(itemId: string, labels: string[]) {
  const parsed = setCardLabelsSchema.safeParse({ itemId, labels })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  if (!ownedItem) return { error: 'Item not found' }

  const { error } = await supabase
    .from('list_items')
    .update({ labels: parsed.data.labels })
    .eq('id', parsed.data.itemId)
    .eq('list_id', ownedItem.listId)

  if (error) return { error: 'Failed to update labels' }

  revalidatePath(`/list/todo/${ownedItem.listId}`)
  return { success: true }
}

export async function getItemResources(itemId: string): Promise<ListItemResourceDTO[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('list_item_resources')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data.map(mapListItemResourceToDTO)
}

export async function addResourceBookmark(itemId: string, url: string) {
  const parsed = addResourceSchema.safeParse({ itemId, url })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedItem = await getOwnedItem(supabase, user.id, parsed.data.itemId)
  if (!ownedItem) return { error: 'Item not found' }

  // Check resource limit: maximum 20 bookmarks per card
  const { count, error: countError } = await supabase
    .from('list_item_resources')
    .select('*', { count: 'exact', head: true })
    .eq('item_id', parsed.data.itemId)

  if (countError) return { error: 'Failed to verify resource count' }
  if ((count ?? 0) >= 20) {
    return { error: 'Card has reached the limit of 20 resource bookmarks' }
  }

  let meta
  try {
    meta = await resolveResourceMetadata(parsed.data.url)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Invalid or blocked URL' }
  }

  const { data, error } = await supabase
    .from('list_item_resources')
    .insert({
      item_id: parsed.data.itemId,
      url: meta.url,
      title: meta.title,
      domain: meta.domain,
      icon_url: meta.icon_url,
    })
    .select()
    .single()

  if (error) return { error: 'Failed to save resource bookmark' }

  revalidatePath(`/list/todo/${ownedItem.listId}`)
  return { success: true, data: mapListItemResourceToDTO(data) }
}

export async function deleteResourceBookmark(resourceId: string) {
  const parsed = deleteResourceSchema.safeParse({ resourceId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase } = await getAuthenticatedUserWithRateLimit()

  // Verify ownership via join
  const { data: resource } = await supabase
    .from('list_item_resources')
    .select('id, item_id, list_items!inner(list_id, lists!inner(user_id))')
    .eq('id', parsed.data.resourceId)
    .single()

  if (!resource) return { error: 'Resource not found' }

  const { error } = await supabase
    .from('list_item_resources')
    .delete()
    .eq('id', parsed.data.resourceId)

  if (error) return { error: 'Failed to delete resource' }

  return { success: true }
}

export async function setColumnWipLimit(columnId: string, wipLimit: number | null) {
  const parsed = setColumnWipLimitSchema.safeParse({ columnId, wipLimit })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedColumn = await getOwnedColumn(supabase, user.id, parsed.data.columnId)
  if (!ownedColumn) return { error: 'Column not found' }

  const { error } = await supabase
    .from('list_columns')
    .update({ wip_limit: parsed.data.wipLimit })
    .eq('id', parsed.data.columnId)
    .eq('list_id', ownedColumn.listId)

  if (error) return { error: 'Failed to update WIP limit' }

  revalidatePath(`/list/todo/${ownedColumn.listId}`)
  return { success: true }
}

export async function importBoardBatch(
  listId: string,
  columns: string[],
  cards: ParsedImportCard[],
) {
  const parsed = importBoardBatchSchema.safeParse({ listId, columns, cards })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) return { error: 'Board not found' }

  // 1. Fetch existing columns on this board
  const { data: existingCols } = await supabase
    .from('list_columns')
    .select('id, title, sort_order')
    .eq('list_id', parsed.data.listId)
    .order('sort_order', { ascending: true })

  const colMap = new Map<string, string>()
  let maxOrder = 0
  for (const c of existingCols || []) {
    colMap.set(c.title.toLowerCase().trim(), c.id)
    if (c.sort_order > maxOrder) maxOrder = c.sort_order
  }

  // 2. Create any missing columns
  for (const requestedCol of parsed.data.columns) {
    const key = requestedCol.toLowerCase().trim()
    if (!colMap.has(key)) {
      maxOrder += DEFAULT_SORT_GAP
      const { data: newCol } = await supabase
        .from('list_columns')
        .insert({
          list_id: parsed.data.listId,
          title: requestedCol.trim(),
          sort_order: maxOrder,
        })
        .select('id, title')
        .single()
      if (newCol) {
        colMap.set(key, newCol.id)
      }
    }
  }

  const defaultColumnId = existingCols?.[0]?.id || Array.from(colMap.values())[0]

  // 3. Register any labels in list_labels
  const distinctLabels = new Set<string>()
  for (const c of parsed.data.cards) {
    if (c.labels) {
      for (const l of c.labels) {
        if (l.trim()) distinctLabels.add(l.trim())
      }
    }
  }

  if (distinctLabels.size > 0) {
    const { data: existingLabels } = await supabase
      .from('list_labels')
      .select('name, color_index')
      .eq('list_id', parsed.data.listId)

    const existingNames = new Set((existingLabels || []).map((l) => l.name.toLowerCase()))
    const currentLabelsList = existingLabels ? [...existingLabels] : []

    for (const labelName of distinctLabels) {
      if (!existingNames.has(labelName.toLowerCase())) {
        const colorIndex = getNextAvailableLabelColorIndex(currentLabelsList)
        const { data: createdLabel } = await supabase
          .from('list_labels')
          .insert({
            list_id: parsed.data.listId,
            name: labelName,
            color_index: colorIndex,
          })
          .select('name, color_index')
          .single()
        if (createdLabel) {
          currentLabelsList.push(createdLabel)
          existingNames.add(labelName.toLowerCase())
        }
      }
    }
  }

  // 4. Insert cards with calculated sort order
  const cardsToInsert = parsed.data.cards.map((c, idx) => {
    const targetColId = colMap.get(c.columnTitle.toLowerCase().trim()) || defaultColumnId
    return {
      list_id: parsed.data.listId,
      column_id: targetColId,
      title: c.title,
      description: c.description || null,
      due_date: c.dueDate || null,
      priority: c.priority || null,
      labels: c.labels || [],
      sort_order: (idx + 1) * DEFAULT_SORT_GAP,
      is_completed: false,
    }
  })

  if (cardsToInsert.length > 0) {
    const { error: insertError } = await supabase.from('list_items').insert(cardsToInsert)
    if (insertError) {
      return { error: 'Failed to insert cards batch' }
    }
  }

  revalidatePath(`/list/todo/${parsed.data.listId}`)
  return { success: true, importedCardsCount: cardsToInsert.length }
}

// ==========================================
// PUBLIC LIST & WISHLIST CLAIM ACTIONS
// ==========================================

export async function getPublicListsByUsername(username: string) {
  const adminClient = createAdminClient()

  const { data: profile, error: profileErr } = await adminClient
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .ilike('username', username.trim().toLowerCase())
    .maybeSingle()

  if (profileErr || !profile) {
    return { error: 'Profile not found', lists: [], profile: null }
  }

  const mappedProfile = {
    id: profile.id,
    username: profile.username,
    full_name: profile.display_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
  }

  const { data: lists, error: listsErr } = await adminClient
    .from('list_summaries')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (listsErr) {
    return { error: 'Failed to load public lists', lists: [], profile: mappedProfile }
  }

  const listDtos = (lists || []).map(mapListWithSummaryToDTO)

  return {
    success: true,
    profile: mappedProfile,
    lists: listDtos,
  }
}

export async function getPublicListBySlug(username: string, slug: string) {
  const adminClient = createAdminClient()

  const { data: profile, error: profileErr } = await adminClient
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .ilike('username', username.trim().toLowerCase())
    .maybeSingle()

  if (profileErr || !profile) {
    return { error: 'Profile not found', list: null, columns: [], items: [], profile: null }
  }

  const mappedProfile = {
    id: profile.id,
    username: profile.username,
    full_name: profile.display_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
  }

  const trimmedSlug = slug.trim()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedSlug)

  let query = adminClient
    .from('lists')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)

  if (isUuid) {
    query = query.or(`slug.eq.${trimmedSlug},id.eq.${trimmedSlug}`)
  } else {
    query = query.eq('slug', trimmedSlug)
  }

  const { data: list, error: listErr } = await query.maybeSingle()

  if (listErr || !list) {
    return { error: 'List not found or is private', list: null, columns: [], items: [], profile: mappedProfile }
  }

  const { data: columns } = await adminClient
    .from('list_columns')
    .select('*')
    .eq('list_id', list.id)
    .order('sort_order', { ascending: true })

  const { data: items, error: itemsErr } = await adminClient
    .from('list_items')
    .select('*, list_subtasks(*), list_item_resources(*)')
    .eq('list_id', list.id)
    .order('sort_order', { ascending: true })

  if (itemsErr) {
    console.error('getPublicListBySlug items query error:', itemsErr)
  }

  const listDto = mapListToDTO(list)
  listDto.item_count = items?.length ?? 0
  listDto.completed_count = items?.filter((i) => i.is_completed).length ?? 0

  const columnDtos = (columns || []).map(mapListColumnToDTO)
  const itemDtos = (items || []).map(mapListItemToDTO)

  return {
    success: true,
    profile: mappedProfile,
    list: listDto,
    columns: columnDtos,
    items: itemDtos,
  }
}

export async function claimWishlistItemAction(input: {
  itemId: string
  claimedByName: string
  note?: string | null
}) {
  const parsed = claimWishlistItemSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const adminClient = createAdminClient()

  // 1. Check item exists and list is public
  const { data: item, error: itemErr } = await adminClient
    .from('list_items')
    .select('id, list_id, metadata, lists!inner(id, type, is_public)')
    .eq('id', parsed.data.itemId)
    .maybeSingle()

  if (itemErr || !item) {
    return { error: 'Item not found' }
  }

  const listData = item.lists
  const isPublic =
    typeof listData === 'object' &&
    listData !== null &&
    'is_public' in listData &&
    Boolean(listData.is_public)

  if (!isPublic) {
    return { error: 'Item does not belong to a public list' }
  }

  const rawMeta = item.metadata
  if (typeof rawMeta === 'object' && rawMeta !== null && !Array.isArray(rawMeta)) {
    const claimVal = rawMeta.claim
    if (typeof claimVal === 'object' && claimVal !== null && !Array.isArray(claimVal)) {
      if ('claimed_at' in claimVal && claimVal.claimed_at) {
        return { error: 'Someone just claimed this gift a moment ago' }
      }
    }
  }

  const claimToken = `claim_${crypto.randomUUID().replace(/-/g, '')}`
  const claimData = {
    claimed_by_name: parsed.data.claimedByName,
    claimed_at: new Date().toISOString(),
    claim_token: claimToken,
    note: parsed.data.note || null,
  }

  // Atomic conditional claim execution via RPC
  const { data: updatedItem, error: rpcErr } = await adminClient.rpc('claim_wishlist_item', {
    p_item_id: parsed.data.itemId,
    p_claim_data: claimData,
  })

  if (rpcErr || !updatedItem) {
    return { error: 'Someone just claimed this gift a moment ago' }
  }

  // Store guest claim token in cookie for guest unclaim flow
  try {
    const cookieStore = await cookies()
    const rawClaims = cookieStore.get('kytbox_guest_claims')?.value
    let claimsList: { itemId: string; claimToken: string }[] = []
    if (rawClaims) {
      try {
        const parsedList = JSON.parse(rawClaims)
        if (Array.isArray(parsedList)) {
          claimsList = parsedList
        }
      } catch {
        claimsList = []
      }
    }
    claimsList = [
      ...claimsList.filter((c) => c.itemId !== parsed.data.itemId),
      { itemId: parsed.data.itemId, claimToken },
    ]
    cookieStore.set('kytbox_guest_claims', JSON.stringify(claimsList), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  } catch {
    // Non-blocking in headless environments
  }

  return { success: true, claimToken }
}

export async function unclaimWishlistItemAction(input: {
  itemId: string
  claimToken: string
}) {
  const parsed = unclaimWishlistItemSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const adminClient = createAdminClient()

  const { data: item, error: itemErr } = await adminClient
    .from('list_items')
    .select('id, metadata')
    .eq('id', parsed.data.itemId)
    .maybeSingle()

  if (itemErr || !item) {
    return { error: 'Item not found' }
  }

  const rawMeta = item.metadata
  if (typeof rawMeta !== 'object' || rawMeta === null || Array.isArray(rawMeta)) {
    return { error: 'Item has not been claimed' }
  }

  const claimVal = rawMeta.claim
  if (typeof claimVal !== 'object' || claimVal === null || Array.isArray(claimVal)) {
    return { error: 'Item has not been claimed' }
  }

  const existingToken = 'claim_token' in claimVal ? String(claimVal.claim_token) : null
  if (existingToken !== parsed.data.claimToken) {
    return { error: 'Unauthorized to unclaim this gift' }
  }

  const updatedMeta: { [key: string]: Database['public']['Tables']['list_items']['Row']['metadata'] } = {}
  for (const [key, val] of Object.entries(rawMeta)) {
    if (key !== 'claim' && val !== undefined) {
      updatedMeta[key] = val
    }
  }

  const { error: updateErr } = await adminClient
    .from('list_items')
    .update({ metadata: updatedMeta })
    .eq('id', parsed.data.itemId)

  if (updateErr) {
    return { error: 'Failed to unclaim gift' }
  }

  try {
    const cookieStore = await cookies()
    const rawClaims = cookieStore.get('kytbox_guest_claims')?.value
    if (rawClaims) {
      try {
        const parsedList = JSON.parse(rawClaims)
        if (Array.isArray(parsedList)) {
          const filtered = parsedList.filter((c) => c.itemId !== parsed.data.itemId)
          cookieStore.set('kytbox_guest_claims', JSON.stringify(filtered), {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return { success: true }
}

export async function releaseWishlistItemClaimAction(input: {
  itemId: string
  listId: string
}) {
  const parsed = releaseWishlistItemClaimSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { supabase, user } = await getAuthenticatedUserWithRateLimit()
  const ownedList = await getOwnedList(supabase, user.id, parsed.data.listId)
  if (!ownedList) {
    return { error: 'List not found or unauthorized' }
  }

  const { data: item, error: itemErr } = await supabase
    .from('list_items')
    .select('id, metadata')
    .eq('id', parsed.data.itemId)
    .eq('list_id', parsed.data.listId)
    .maybeSingle()

  if (itemErr || !item) {
    return { error: 'Item not found' }
  }

  const rawMeta = item.metadata
  const updatedMeta: { [key: string]: Database['public']['Tables']['list_items']['Row']['metadata'] } = {}
  if (typeof rawMeta === 'object' && rawMeta !== null && !Array.isArray(rawMeta)) {
    for (const [key, val] of Object.entries(rawMeta)) {
      if (key !== 'claim' && val !== undefined) {
        updatedMeta[key] = val
      }
    }
  }

  const { error: updateErr } = await supabase
    .from('list_items')
    .update({ metadata: updatedMeta })
    .eq('id', parsed.data.itemId)
    .eq('list_id', parsed.data.listId)

  if (updateErr) {
    return { error: 'Failed to release claim' }
  }

  revalidatePath(`/list/${parsed.data.listId}`)
  revalidatePath(`/list/wishlist/${parsed.data.listId}`)
  return { success: true }
}

