export interface AdminUserResourceCounts {
  links: number;
  cashflows: number;
  lists: number;
  vehicles: number;
  invoices: number;
  hasCustomDomain: boolean;
}

export interface AdminUserSummaryDTO {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  role: 'admin' | 'user';
  createdAt: string;
  hasCompletedOnboarding: boolean;
  counts: AdminUserResourceCounts;
}

export interface AdminUsersQueryResult {
  users: AdminUserSummaryDTO[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}
