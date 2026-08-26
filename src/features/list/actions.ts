'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUserWithRateLimit } from '@/lib/auth-with-rate-limit'
import { createNotification } from '@/features/notifications'
import type { Database } from '@/types/supabase'
import type { ListDTO, ListItemDTO, ListType, ListColumnDTO, ListItemPriority } from '@/types/dto'
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
  toggleDoneColumnSchema,
  toggleItemSchema,
  toggleListPublicSchema,
  updateColumnSchema,
  updateItemActionSchema,
  updateListActionSchema,
  createBoardFromTemplateSchema,
} from './schemas.server'
import { formatDueDateLabel } from './lib/due-date'
import {
  mapListToDTO,
  mapListWithSummaryToDTO,
  mapListItemToDTO,
  mapListSubtaskToDTO,
  mapListColumnToDTO,
} from '@/lib/mappers'
import { BOARD_TEMPLATES } from './templates'

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

  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      type: parsed.data.type,
      description: parsed.data.description || null,
      is_public: false,
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

  const { error } = await supabase
    .from('lists')
    .update({
      is_public: parsed.data.isPublic,
    })
    .eq('id', parsed.data.listId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update list visibility' }
  }

  revalidatePath('/list')
  return { success: true }
}

// ==========================================
// ITEM-LEVEL ACTIONS
// ==========================================

export async function addItem(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUserWithRateLimit()

  const listId = String(formData.get('listId') || '')
  const rawDueDate = formData.get('dueDate') ?? formData.get('due_date')
  const rawPriority = formData.get('priority')

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
  const payload: {
    title: string
    description?: string
    dueDate?: string | null
    priority?: string | null
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
      metadata = metaParsed.data
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

  const updatePayload: {
    column_id: string
    sort_order: number
    is_completed?: boolean
  } = {
    column_id: parsed.data.columnId,
    sort_order: parsed.data.sortOrder,
  }

  // Completion is intentionally sticky: leaving a done column does not undo completion.
  // The destination column is authoritative; do not trust the client flag for this.
  if (ownedColumn.isDoneColumn) {
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
    .select('*, list_subtasks(*)')
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
