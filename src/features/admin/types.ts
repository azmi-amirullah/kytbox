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

export interface AdminTokenUsageUserDTO {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  scanCount: number;
  inputTokens: number;
  outputTokens: number;
}

export interface AdminTokenUsageOverviewDTO {
  users: AdminTokenUsageUserDTO[];
  totals: {
    scanCount: number;
    inputTokens: number;
    outputTokens: number;
  };
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface AdminTokenUsageHistoryDTO {
  user: Pick<AdminTokenUsageUserDTO, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'email'>;
  period: 'daily' | 'monthly';
  records: Array<{
    bucketDate: string;
    scanCount: number;
    inputTokens: number;
    outputTokens: number;
  }>;
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}
