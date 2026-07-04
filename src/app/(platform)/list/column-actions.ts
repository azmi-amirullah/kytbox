'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ListColumnDTO } from '@/types/dto';
import { listColumnSchema } from '@/lib/validation.schemas';
import { mapListColumnToDTO } from '@/lib/mappers';

// ==========================================
// COLUMN ACTIONS — Kanban column management
// ==========================================

const DEFAULT_COLUMNS = [
  { title: 'Todo', sort_order: 0, is_done_column: false },
  { title: 'In Progress', sort_order: 1024, is_done_column: false },
  { title: 'Review', sort_order: 2048, is_done_column: false },
  { title: 'Completed', sort_order: 3072, is_done_column: true },
];

export async function seedDefaultColumns(
  listId: string,
): Promise<ListColumnDTO[]> {
  const supabase = await createClient();

  const columnsToInsert = DEFAULT_COLUMNS.map((col) => ({
    list_id: listId,
    title: col.title,
    sort_order: col.sort_order,
    is_done_column: col.is_done_column,
  }));

  const { data, error } = await supabase
    .from('list_columns')
    .insert(columnsToInsert)
    .select();

  if (error || !data) {
    throw new Error('Failed to seed columns');
  }

  return data.map(mapListColumnToDTO);
}

export async function getColumnsByListId(
  listId: string,
): Promise<ListColumnDTO[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('list_columns')
    .select('*')
    .eq('list_id', listId)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data.map(mapListColumnToDTO);
}

export async function addColumn(listId: string, title: string) {
  const parsed = listColumnSchema.safeParse({ title });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid column title' };
  }

  const supabase = await createClient();

  const { data: cols } = await supabase
    .from('list_columns')
    .select('sort_order')
    .eq('list_id', listId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = cols && cols.length > 0 ? cols[0].sort_order + 1024 : 1024;

  const { data, error } = await supabase
    .from('list_columns')
    .insert({
      list_id: listId,
      title: parsed.data.title,
      sort_order: nextOrder,
      is_done_column: false,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: 'Failed to add column' };
  }

  revalidatePath('/list');
  return { success: true, data: mapListColumnToDTO(data) };
}

export async function updateColumn(columnId: string, title: string) {
  const parsed = listColumnSchema.safeParse({ title });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid column title' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('list_columns')
    .update({ title: parsed.data.title })
    .eq('id', columnId);

  if (error) {
    return { error: 'Failed to update column' };
  }

  revalidatePath('/list');
  return { success: true };
}

export async function deleteColumn(columnId: string) {
  const supabase = await createClient();

  // Validate it's not the last column
  const { data: col } = await supabase.from('list_columns').select('list_id').eq('id', columnId).single();
  if (col) {
    const { count } = await supabase.from('list_columns').select('*', { count: 'exact', head: true }).eq('list_id', col.list_id);
    if (count !== null && count <= 1) {
      return { error: 'Cannot delete the last column' };
    }
  }

  const { error } = await supabase
    .from('list_columns')
    .delete()
    .eq('id', columnId);

  if (error) {
    return { error: 'Failed to delete column' };
  }

  revalidatePath('/list');
  return { success: true };
}

export async function reorderColumns(listId: string, columnIds: string[]) {
  const supabase = await createClient();

  const promises = columnIds.map((id, index) => 
    supabase.from('list_columns').update({ sort_order: index * 1024 }).eq('id', id)
  );
  
  await Promise.all(promises);

  revalidatePath('/list');
  return { success: true };
}

export async function toggleDoneColumn(columnId: string, isDoneColumn: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('list_columns')
    .update({ is_done_column: isDoneColumn })
    .eq('id', columnId);

  if (error) {
    return { error: 'Failed to update column' };
  }

  revalidatePath('/list');
  return { success: true };
}
