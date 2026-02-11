export type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  category: 'general' | 'bug' | 'billing' | 'feature_request' | 'account';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  urgency_score: number; // bump points (+10 per bump)
  last_bumped_at: string | null;
  created_at: string;
  age_days?: number;
  total_urgency?: number;
  unread_count?: number;
  awaiting_user_reply?: boolean;
  user_seen_no_reply?: boolean;
  // Joins
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
};

export type SupportMessage = {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  read_at: string | null; // For unread status
  created_at: string;
  // Joins
  profiles?: {
    username: string;
    avatar_url: string | null;
    role: 'user' | 'admin';
  };
};
