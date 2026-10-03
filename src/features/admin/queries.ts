import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin';
import { userRoleSchema } from '@/lib/validation.schemas';
import {
  adminTokenUsageHistoryQuerySchema,
  adminTokenUsageQuerySchema,
  adminTokenUsageUserIdSchema,
  adminUsersQuerySchema,
  type AdminTokenUsageHistoryQueryInput,
  type AdminTokenUsageQueryInput,
  type AdminUsersQueryInput,
} from './schemas';
import type {
  AdminTokenUsageHistoryDTO,
  AdminTokenUsageOverviewDTO,
  AdminTokenUsageUserDTO,
  AdminUserSummaryDTO,
  AdminUsersQueryResult,
} from './types';

export async function getAdminUsersOverview(
  rawParams?: Partial<AdminUsersQueryInput> | Record<string, unknown>,
): Promise<AdminUsersQueryResult> {
  await requireAdmin();
  const supabase = await createClient();

  const validated = adminUsersQuerySchema.parse(rawParams ?? {});
  const { search, page, pageSize } = validated;
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc('get_admin_users_overview', {
    p_search: search || undefined,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    throw new Error(`Failed to fetch admin users overview: ${error.message}`);
  }

  const rows = data || [];
  const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const users: AdminUserSummaryDTO[] = rows.map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name || null,
    avatarUrl: row.avatar_url || null,
    email: row.email || null,
    role: userRoleSchema.parse(row.role),
    createdAt: row.created_at,
    hasCompletedOnboarding: Boolean(row.has_completed_onboarding),
    counts: {
      links: Number(row.links_count) || 0,
      cashflows: Number(row.cashflows_count) || 0,
      lists: Number(row.lists_count) || 0,
      vehicles: Number(row.vehicles_count) || 0,
      invoices: Number(row.invoices_count) || 0,
      hasCustomDomain: Boolean(row.has_custom_domain),
    },
  }));

  return {
    users,
    totalCount,
    totalPages,
    page,
    pageSize,
  };
}

export async function getAdminTokenUsageOverview(
  rawParams?: Partial<AdminTokenUsageQueryInput> | Record<string, unknown>,
): Promise<AdminTokenUsageOverviewDTO> {
  await requireAdmin();
  const supabase = await createClient();
  const validated = adminTokenUsageQuerySchema.parse(rawParams ?? {});
  const offset = (validated.page - 1) * validated.pageSize;

  const { data, error } = await supabase.rpc('get_admin_ai_token_usage', {
    p_limit: validated.pageSize,
    p_offset: offset,
  });

  if (error) {
    throw new Error(`Failed to fetch admin token usage: ${error.message}`);
  }

  let rows = data ?? [];
  const summary = rows[0];
  const totalCount = Number(summary?.total_count) || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / validated.pageSize));
  const page = Math.min(validated.page, totalPages);

  if (page !== validated.page) {
    const { data: correctedData, error: correctedError } = await supabase.rpc(
      'get_admin_ai_token_usage',
      {
        p_limit: validated.pageSize,
        p_offset: (page - 1) * validated.pageSize,
      },
    );

    if (correctedError) {
      throw new Error(`Failed to fetch admin token usage: ${correctedError.message}`);
    }

    rows = correctedData ?? [];
  }

  const users: AdminTokenUsageUserDTO[] = rows.flatMap((row) => {
    if (
      row.id === null ||
      row.username === null ||
      row.scan_count === null ||
      row.input_tokens === null ||
      row.output_tokens === null
    ) {
      return [];
    }

    return [{
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      email: row.email,
      scanCount: Number(row.scan_count) || 0,
      inputTokens: Number(row.input_tokens) || 0,
      outputTokens: Number(row.output_tokens) || 0,
    }];
  });

  return {
    users,
    totals: {
      scanCount: Number(summary?.total_scan_count) || 0,
      inputTokens: Number(summary?.total_input_tokens) || 0,
      outputTokens: Number(summary?.total_output_tokens) || 0,
    },
    totalCount,
    totalPages,
    page,
    pageSize: validated.pageSize,
  };
}

export async function getAdminTokenUsageHistory(
  rawUserId: string,
  rawParams?: Partial<AdminTokenUsageHistoryQueryInput> | Record<string, unknown>,
): Promise<AdminTokenUsageHistoryDTO | null> {
  await requireAdmin();
  const userIdResult = adminTokenUsageUserIdSchema.safeParse(rawUserId);
  if (!userIdResult.success) return null;
  const userId = userIdResult.data;
  const validated = adminTokenUsageHistoryQuerySchema.parse(rawParams ?? {});
  const supabase = await createClient();

  const fetchRows = async (page: number) => {
    const { data, error } = await supabase.rpc('get_admin_ai_token_usage_history', {
      p_user_id: userId,
      p_period: validated.period,
      p_limit: validated.pageSize,
      p_offset: (page - 1) * validated.pageSize,
    });

    if (error) {
      throw new Error(`Failed to fetch admin token usage history: ${error.message}`);
    }

    return data ?? [];
  };

  let rows = await fetchRows(validated.page);
  const summary = rows[0];
  if (!summary || summary.id === null || summary.username === null) return null;

  const totalCount = Number(summary.total_count) || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / validated.pageSize));
  const page = Math.min(validated.page, totalPages);

  if (page !== validated.page) {
    rows = await fetchRows(page);
  }

  const userSummary = rows[0];
  if (!userSummary || userSummary.id === null || userSummary.username === null) return null;

  return {
    user: {
      id: userSummary.id,
      username: userSummary.username,
      displayName: userSummary.display_name,
      avatarUrl: userSummary.avatar_url,
      email: userSummary.email,
    },
    period: validated.period,
    records: rows.flatMap((row) => {
      if (
        row.bucket_date === null ||
        row.scan_count === null ||
        row.input_tokens === null ||
        row.output_tokens === null
      ) {
        return [];
      }

      return [{
        bucketDate: row.bucket_date,
        scanCount: Number(row.scan_count) || 0,
        inputTokens: Number(row.input_tokens) || 0,
        outputTokens: Number(row.output_tokens) || 0,
      }];
    }),
    totalCount,
    totalPages,
    page,
    pageSize: validated.pageSize,
  };
}
