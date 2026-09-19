import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type ServerSupabaseClient = SupabaseClient<Database>

/**
 * Converts a title string into a clean URL-friendly slug.
 */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || 'list'
}

export type SlugExistenceChecker = (slug: string) => Promise<boolean>

/**
 * Generates a unique slug for a user's list, appending an incrementing suffix if necessary.
 */
export async function generateUniqueListSlug(
  supabaseOrChecker: ServerSupabaseClient | SlugExistenceChecker,
  userId: string,
  title: string,
  excludeListId?: string
): Promise<string> {
  const base = slugify(title)
  let candidate = base
  let counter = 1

  const checkTaken: SlugExistenceChecker =
    typeof supabaseOrChecker === 'function'
      ? supabaseOrChecker
      : async (slugToCheck: string): Promise<boolean> => {
          let query = supabaseOrChecker
            .from('lists')
            .select('id')
            .eq('user_id', userId)
            .eq('slug', slugToCheck)

          if (excludeListId) {
            query = query.neq('id', excludeListId)
          }

          const { data } = await query.maybeSingle()
          return Boolean(data)
        }

  while (counter <= 100) {
    const isTaken = await checkTaken(candidate)
    if (!isTaken) {
      return candidate
    }

    counter++
    candidate = `${base}-${counter}`
  }

  // Fallback random suffix if counter exceeds 100
  return `${base}-${Math.random().toString(36).substring(2, 8)}`
}
