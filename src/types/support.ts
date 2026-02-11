export type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  category: 'general' | 'bug' | 'billing' | 'feature_request' | 'account';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  urgency_score: number;
  last_bumped_at: string | null;
  created_at: string;
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
