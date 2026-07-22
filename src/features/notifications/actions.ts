'use server';

import { getAuthenticatedUserWithRateLimit as getAuthenticatedUser } from '@/lib/auth-with-rate-limit';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { NotificationDTO, NotificationType } from './types';

function parseNotificationType(type: string): NotificationType {
  if (
    type === 'support_reply' ||
    type === 'budget_warning' ||
    type === 'budget_exceeded' ||
    type === 'click_milestone' ||
    type === 'system'
  ) {
    return type;
  }
  return 'system';
}

export async function getNotifications(): Promise<{
  notifications: NotificationDTO[];
  unreadCount: number;
  error?: string;
}> {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    // Fetch last 20 notifications
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], unreadCount: 0, error: 'Failed to load notifications' };
    }

    // Fetch unread count
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);

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
    const { user, supabase } = await getAuthenticatedUser();

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark as read' };
    }

    revalidatePath('/app');
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

    revalidatePath('/app');
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to mark all as read';
    return { success: false, error: errorMessage };
  }
}

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  linkUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body || null,
      link_url: params.linkUrl || null,
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
