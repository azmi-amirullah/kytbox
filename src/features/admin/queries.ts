import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin';
import { userRoleSchema } from '@/lib/validation.schemas';
import { adminUsersQuerySchema, type AdminUsersQueryInput } from './schemas';
import type { AdminUserSummaryDTO, AdminUsersQueryResult } from './types';

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
