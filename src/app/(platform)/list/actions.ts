'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ListDTO, ListItemDTO, ListType } from '@/types/dto';
import { z } from 'zod';
import {

  createListSchema,
  updateListSchema,
  createListItemSchema,
  listItemSchema,
  listTypeSchema,
  wishlistMetadataSchema,
} from '@/lib/validation.schemas';
import {
  mapListWithSummaryToDTO,
  mapListItemToDTO,
} from '@/lib/mappers';

// ==========================================
// LIST-LEVEL ACTIONS
// ==========================================

export async function createList(formData: FormData) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: 'Unauthorized' };
  }

  const payload = {
    title: String(formData.get('title') || ''),
    type: String(formData.get('type') || ''),
    description: formData.get('description') ? String(formData.get('description')) : undefined,
  };

  const parsed = createListSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: userData.user.id,
      title: parsed.data.title,
      type: parsed.data.type,
      description: parsed.data.description || null,
      is_public: false,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: 'Failed to create list' };
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
  };

  revalidatePath('/list');
  return { success: true, data: listDto };
}

export async function updateList(listId: string, formData: FormData) {
  const supabase = await createClient();

  const payload = {
    title: String(formData.get('title') || ''),
    description: formData.get('description') ? String(formData.get('description')) : undefined,
  };

  const parsed = updateListSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { error } = await supabase
    .from('lists')
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
    })
    .eq('id', listId);

  if (error) {
    return { error: 'Failed to update list' };
  }

  revalidatePath('/list');
  return { success: true };
}

export async function deleteList(listId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId);

  if (error) {
    return { error: 'Failed to delete list' };
  }

  revalidatePath('/list');
  return { success: true };
}

export async function toggleListPublic(listId: string, isPublic: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('lists')
    .update({
      is_public: isPublic,
    })
    .eq('id', listId);

  if (error) {
    return { error: 'Failed to update list visibility' };
  }

  revalidatePath('/list');
  return { success: true };
}

// ==========================================
// ITEM-LEVEL ACTIONS
// ==========================================

export async function addItem(formData: FormData) {
  const supabase = await createClient();

  const listId = String(formData.get('listId') || '');
  const { data: listData } = await supabase.from('lists').select('type').eq('id', listId).single();
  
  if (!listData) return { error: 'List not found' };

  const payload = {
    listId,
    title: String(formData.get('title') || ''),
    description: formData.get('description') ? String(formData.get('description')) : undefined,
    columnId: formData.get('columnId') ? String(formData.get('columnId')) : undefined,
  };

  const parsed = createListItemSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { data: itemsData } = await supabase
    .from('list_items')
    .select('sort_order')
    .eq('list_id', parsed.data.listId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = itemsData && itemsData.length > 0 ? itemsData[0].sort_order + 1024 : 1024;

  let metadata = null;
  if (listData.type === 'wishlist') {
    const metaPayload = {
      price: formData.get('price'),
      currency: formData.get('currency'),
      purchase_url: formData.get('purchase_url'),
    };
    const metaParsed = wishlistMetadataSchema.safeParse(metaPayload);
    if (metaParsed.success) {
      metadata = metaParsed.data;
    }
  }

  const { data, error } = await supabase
    .from('list_items')
    .insert({
      list_id: parsed.data.listId,
      column_id: parsed.data.columnId || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      sort_order: nextSortOrder,
      metadata,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: 'Failed to add item' };
  }

  revalidatePath('/list');
  return { success: true, data: mapListItemToDTO(data) };
}

export async function updateItem(itemId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: itemData } = await supabase.from('list_items').select('list_id, lists(type)').eq('id', itemId).single();
  if (!itemData) return { error: 'Item not found' };

  const payload = {
    title: String(formData.get('title') || ''),
    description: formData.get('description') ? String(formData.get('description')) : undefined,
  };

  const parsed = listItemSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  // Bypass the deep nested array inference issues
  const listsRelSchema = z.union([
    z.object({ type: z.string() }),
    z.array(z.object({ type: z.string() }))
  ]).catch({ type: 'todo' });
  const listsRel = listsRelSchema.parse(itemData.lists);
  const listType = Array.isArray(listsRel) ? listsRel[0]?.type : listsRel?.type;

  let metadata: { [key: string]: unknown } | null | undefined = undefined;
  if (listType === 'wishlist') {
    const metaPayload = {
      price: formData.get('price'),
      currency: formData.get('currency'),
      purchase_url: formData.get('purchase_url'),
    };
    const metaParsed = wishlistMetadataSchema.safeParse(metaPayload);
    if (metaParsed.success) {
      metadata = metaParsed.data;
    }
  }

  const updatePayload: Record<string, unknown> = {
    title: parsed.data.title,
    description: parsed.data.description || null,
  };
  if (metadata !== undefined) {
    updatePayload.metadata = metadata;
  }

  const { error } = await supabase
    .from('list_items')
    .update(updatePayload)
    .eq('id', itemId);

  if (error) {
    return { error: 'Failed to update item' };
  }

  revalidatePath('/list');
  return { success: true };
}

export async function toggleItem(itemId: string, isCompleted: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('list_items')
    .update({ is_completed: isCompleted })
    .eq('id', itemId);

  if (error) {
    return { error: 'Failed to toggle item' };
  }

  revalidatePath('/list');
  return { success: true };
}

export async function deleteItem(itemId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    return { error: 'Failed to delete item' };
  }

  revalidatePath('/list');
  return { success: true };
}

export async function reorderItems(listId: string, itemIds: string[]) {
  const supabase = await createClient();

  const promises = itemIds.map((id, index) => 
    supabase.from('list_items').update({ sort_order: index * 1024 }).eq('id', id)
  );
  
  await Promise.all(promises);

  revalidatePath('/list');
  return { success: true };
}

export async function moveItem(
  itemId: string,
  columnId: string,
  sortOrder: number,
  isDoneColumn: boolean,
) {
  const supabase = await createClient();

  const updatePayload: {
    column_id: string;
    sort_order: number;
    is_completed?: boolean;
  } = {
    column_id: columnId,
    sort_order: sortOrder,
  };

  if (isDoneColumn) {
    updatePayload.is_completed = true;
  }

  const { error } = await supabase
    .from('list_items')
    .update(updatePayload)
    .eq('id', itemId);

  if (error) {
    return { error: 'Failed to move item' };
  }

  revalidatePath('/list');
  return { success: true };
}

// ==========================================
// QUERY HELPERS (for server components)
// ==========================================

export async function getListsByType(type: ListType): Promise<ListDTO[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('list_summaries')
    .select('*')
    .eq('type', type)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapListWithSummaryToDTO);
}

export async function getListCounts(): Promise<Record<ListType, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('list_summaries')
    .select('type');

  const counts: Record<ListType, number> = { todo: 0, wishlist: 0, idea: 0 };
  if (!error && data) {
    data.forEach(l => {
      const type = listTypeSchema.catch('todo').parse(l.type);
      counts[type]++;
    });
  }
  return counts;
}

export async function getListById(
  listId: string,
): Promise<ListDTO | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('list_summaries')
    .select('*')
    .eq('id', listId)
    .single();

  if (error || !data) return null;
  return mapListWithSummaryToDTO(data);
}

export async function getItemsByListId(
  listId: string,
): Promise<ListItemDTO[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('list_items')
    .select('*')
    .eq('list_id', listId)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data.map(mapListItemToDTO);
}
