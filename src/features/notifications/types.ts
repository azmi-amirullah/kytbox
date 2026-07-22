export type NotificationType =
  | 'support_reply'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'click_milestone'
  | 'system';

export interface NotificationDTO {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
}
