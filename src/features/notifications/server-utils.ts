import { createClient } from '@/lib/supabase/server';
import { createNotificationSchema, type CreateNotificationInput } from './schemas';

/**
 * Internal server helper to create a notification for a user.
 * NOT exposed as a public 'use server' action RPC endpoint to prevent client endpoint spoofing.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = createNotificationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { userId, type, title, body, linkUrl } = parsed.data;
    const supabase = await createClient();

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      link_url: linkUrl || null,
    });

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: 'Failed to create notification' };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create notification';
    return { success: false, error: errorMessage };
  }
}
