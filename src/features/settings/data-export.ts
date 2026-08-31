import JSZip from 'jszip';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export interface ExportManifest {
  app: string;
  version: string;
  exported_at: string;
  user_id: string;
  format_version: string;
  summary: {
    profile: number;
    bio_links: number;
    bio_subscribers: number;
    custom_domains: number;
    cashflow_books: number;
    cashflow_transactions: number;
    cashflow_splits: number;
    cashflow_budgets: number;
    cashflow_goals: number;
    cashflow_tags: number;
    lists: number;
    list_columns: number;
    list_items: number;
    list_subtasks: number;
    invoices: number;
    invoice_items: number;
  };
}

export interface UserExportData {
  manifest: ExportManifest;
  profile: Database['public']['Tables']['profiles']['Row'] | null;
  bio: {
    links: Database['public']['Tables']['links']['Row'][];
    subscribers: Database['public']['Tables']['bio_subscribers']['Row'][];
    domains: Database['public']['Tables']['custom_domains']['Row'][];
  };
  cashflow: {
    cashflows: Database['public']['Tables']['cashflows']['Row'][];
    entries: Database['public']['Tables']['cashflow_entries']['Row'][];
    split_entries: Database['public']['Tables']['cashflow_split_entries']['Row'][];
    budgets: Database['public']['Tables']['cashflow_budgets']['Row'][];
    goals: Database['public']['Tables']['cashflow_goals']['Row'][];
    tags: Database['public']['Tables']['cashflow_tags']['Row'][];
    shares: Database['public']['Tables']['cashflow_shares']['Row'][];
  };
  list: {
    lists: Database['public']['Tables']['lists']['Row'][];
    columns: Database['public']['Tables']['list_columns']['Row'][];
    items: Database['public']['Tables']['list_items']['Row'][];
    subtasks: Database['public']['Tables']['list_subtasks']['Row'][];
  };
  invoices: {
    invoices: Database['public']['Tables']['invoices']['Row'][];
    items: Database['public']['Tables']['invoice_items']['Row'][];
  };
}

/**
 * Extract all user data across all Kytbox sub-apps and domains.
 */
export async function extractUserData(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<UserExportData> {
  // Phase 1: Top-level domain tables
  const [
    profileRes,
    linksRes,
    bioSubsRes,
    domainsRes,
    cashflowsRes,
    cashflowTagsRes,
    listsRes,
    invoicesRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('links').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
    supabase.from('bio_subscribers').select('*').eq('profile_id', userId).order('created_at', { ascending: false }),
    supabase.from('custom_domains').select('*').eq('user_id', userId),
    supabase.from('cashflows').select('*').eq('user_id', userId),
    supabase.from('cashflow_tags').select('*').eq('user_id', userId),
    supabase.from('lists').select('*').eq('user_id', userId),
    supabase.from('invoices').select('*').eq('user_id', userId).order('issue_date', { ascending: false }),
  ]);

  const profile = profileRes.data || null;
  const links = linksRes.data || [];
  const subscribers = bioSubsRes.data || [];
  const domains = domainsRes.data || [];
  const cashflows = cashflowsRes.data || [];
  const cashflowTags = cashflowTagsRes.data || [];
  const lists = listsRes.data || [];
  const invoices = invoicesRes.data || [];

  // Phase 2: Relational child tables (Cashflow, List, Invoices)
  const cashflowIds = cashflows.map((c) => c.id);
  const listIds = lists.map((l) => l.id);
  const invoiceIds = invoices.map((i) => i.id);

  const [
    cashflowEntriesRes,
    cashflowBudgetsRes,
    cashflowGoalsRes,
    cashflowSharesRes,
    listColumnsRes,
    listItemsRes,
    invoiceItemsRes,
  ] = await Promise.all([
    cashflowIds.length > 0
      ? supabase.from('cashflow_entries').select('*').in('cashflow_id', cashflowIds).order('date', { ascending: false })
      : Promise.resolve({ data: [] }),
    cashflowIds.length > 0
      ? supabase.from('cashflow_budgets').select('*').in('cashflow_id', cashflowIds)
      : Promise.resolve({ data: [] }),
    cashflowIds.length > 0
      ? supabase.from('cashflow_goals').select('*').in('cashflow_id', cashflowIds)
      : Promise.resolve({ data: [] }),
    cashflowIds.length > 0
      ? supabase.from('cashflow_shares').select('*').in('cashflow_id', cashflowIds)
      : Promise.resolve({ data: [] }),
    listIds.length > 0
      ? supabase.from('list_columns').select('*').in('list_id', listIds).order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] }),
    listIds.length > 0
      ? supabase.from('list_items').select('*').in('list_id', listIds).order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] }),
    invoiceIds.length > 0
      ? supabase.from('invoice_items').select('*').in('invoice_id', invoiceIds).order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const cashflowEntries = cashflowEntriesRes.data || [];
  const cashflowBudgets = cashflowBudgetsRes.data || [];
  const cashflowGoals = cashflowGoalsRes.data || [];
  const cashflowShares = cashflowSharesRes.data || [];
  const listColumns = listColumnsRes.data || [];
  const listItems = listItemsRes.data || [];
  const invoiceItems = invoiceItemsRes.data || [];

  // Phase 3: Grandchildren tables (Split entries, Subtasks)
  const entryIds = cashflowEntries.map((e) => e.id);
  const itemIds = listItems.map((item) => item.id);

  const [splitEntriesRes, subtasksRes] = await Promise.all([
    entryIds.length > 0
      ? supabase.from('cashflow_split_entries').select('*').in('parent_entry_id', entryIds)
      : Promise.resolve({ data: [] }),
    itemIds.length > 0
      ? supabase.from('list_subtasks').select('*').in('item_id', itemIds).order('position', { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const splitEntries = splitEntriesRes.data || [];
  const subtasks = subtasksRes.data || [];

  const manifest: ExportManifest = {
    app: 'Kytbox',
    version: '2.0.0',
    exported_at: new Date().toISOString(),
    user_id: userId,
    format_version: '1.0',
    summary: {
      profile: profile ? 1 : 0,
      bio_links: links.length,
      bio_subscribers: subscribers.length,
      custom_domains: domains.length,
      cashflow_books: cashflows.length,
      cashflow_transactions: cashflowEntries.length,
      cashflow_splits: splitEntries.length,
      cashflow_budgets: cashflowBudgets.length,
      cashflow_goals: cashflowGoals.length,
      cashflow_tags: cashflowTags.length,
      lists: lists.length,
      list_columns: listColumns.length,
      list_items: listItems.length,
      list_subtasks: subtasks.length,
      invoices: invoices.length,
      invoice_items: invoiceItems.length,
    },
  };

  return {
    manifest,
    profile,
    bio: {
      links,
      subscribers,
      domains,
    },
    cashflow: {
      cashflows,
      entries: cashflowEntries,
      split_entries: splitEntries,
      budgets: cashflowBudgets,
      goals: cashflowGoals,
      tags: cashflowTags,
      shares: cashflowShares,
    },
    list: {
      lists,
      columns: listColumns,
      items: listItems,
      subtasks,
    },
    invoices: {
      invoices,
      items: invoiceItems,
    },
  };
}

/**
 * Generate a ZIP file buffer containing all exported user data formatted cleanly.
 */
export async function generateExportZip(data: UserExportData): Promise<Buffer> {
  const zip = new JSZip();

  const readmeContent = `================================================================================
KYTBOX DATA ARCHIVE
================================================================================

Export Generated: ${data.manifest.exported_at}
Account User ID : ${data.manifest.user_id}
Platform Version: ${data.manifest.version}
Format Version  : ${data.manifest.format_version}

This archive contains a complete, structured export of your personal data,
configuration, and workspace records across all Kytbox apps in JSON format.

--------------------------------------------------------------------------------
ARCHIVE DIRECTORY MAP
--------------------------------------------------------------------------------
1. manifest.json      - Metadata and record counts for this archive.
2. profile.json       - Account profile, username, bio, and global preferences.
3. bio.json           - Bio links, custom domains, and lead subscribers.
4. cashflow.json      - Cashflows, transactions, split entries, budgets, goals, tags, and shares.
5. list.json          - Lists, columns, items, and subtasks.
6. invoices.json      - Invoices, client details, and line items.

--------------------------------------------------------------------------------
PRIVACY & SECURITY NOTICE
--------------------------------------------------------------------------------
This archive contains private financial records, credentials, and personal notes.
Please store this archive in a secure location and delete it when no longer needed.

For inquiries, contact support at: https://kytbox.app/support
================================================================================
`;

  zip.file('README.txt', readmeContent);
  zip.file('manifest.json', JSON.stringify(data.manifest, null, 2));
  zip.file('profile.json', JSON.stringify(data.profile, null, 2));
  zip.file('bio.json', JSON.stringify(data.bio, null, 2));
  zip.file('cashflow.json', JSON.stringify(data.cashflow, null, 2));
  zip.file('list.json', JSON.stringify(data.list, null, 2));
  zip.file('invoices.json', JSON.stringify(data.invoices, null, 2));

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
