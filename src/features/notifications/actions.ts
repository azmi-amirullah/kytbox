'use server';

import { getAuthenticatedUserWithRateLimit as getAuthenticatedUser } from '@/lib/auth-with-rate-limit';
import type { NotificationDTO, NotificationType } from './types';
import { markAsReadSchema, notificationTypeSchema } from './schemas';

function parseNotificationType(type: string): NotificationType {
  const result = notificationTypeSchema.safeParse(type);
  return result.success ? result.data : 'system';
}

export async function getNotifications(): Promise<{
  notifications: NotificationDTO[];
  unreadCount: number;
  error?: string;
}> {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    // Parallelize notification fetching and unread count queries
    const [{ data, error }, { count, error: countError }] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null),
    ]);

    if (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], unreadCount: 0, error: 'Failed to load notifications' };
    }

    if (countError) {
      console.error('Error fetching unread notification count:', countError);
    }

    const notifications: NotificationDTO[] = (data || []).map((n) => ({
      id: n.id,
      user_id: n.user_id,
      type: parseNotificationType(n.type),
      title: n.title,
      body: n.body,
      link_url: n.link_url,
      read_at: n.read_at,
      created_at: n.created_at || new Date().toISOString(),
    }));

    return {
      notifications,
      unreadCount: count ?? 0,
    };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markAsRead(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = markAsReadSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { user, supabase } = await getAuthenticatedUser();

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', parsed.data.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark as read' };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to mark as read';
    return { success: false, error: errorMessage };
  }
}

export async function markAllAsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: 'Failed to mark all as read' };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to mark all as read';
    return { success: false, error: errorMessage };
  }
}
