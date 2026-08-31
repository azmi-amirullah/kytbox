import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  generateExportZip,
  type UserExportData,
} from '@/features/settings/data-export';

describe('GDPR Data Export Engine', () => {
  const mockUserId = 'user-123-uuid';

  const mockExportData: UserExportData = {
    manifest: {
      app: 'Kytbox',
      version: '2.0.0',
      exported_at: '2026-08-31T09:45:00.000Z',
      user_id: mockUserId,
      format_version: '1.0',
      summary: {
        profile: 1,
        bio_links: 2,
        bio_subscribers: 1,
        custom_domains: 1,
        cashflow_books: 1,
        cashflow_transactions: 2,
        cashflow_splits: 2,
        cashflow_budgets: 1,
        cashflow_goals: 1,
        cashflow_tags: 1,
        lists: 1,
        list_columns: 2,
        list_items: 2,
        list_subtasks: 1,
        invoices: 1,
        invoice_items: 1,
      },
    },
    profile: {
      id: mockUserId,
      username: 'johndoe',
      display_name: 'John Doe',
      bio: 'Creator & Builder',
      avatar_url: 'https://example.com/avatar.jpg',
      theme_name: 'slate',
      button_style: 'rounded',
      button_shape: 'pill',
      default_currency: 'USD',
      role: 'user',
      created_at: '2026-08-01T00:00:00Z',
      has_completed_onboarding: true,
      lead_capture_enabled: true,
      custom_theme: null,
      meta_description: null,
      meta_title: null,
      og_image_url: null,
      social_links: {},
      tier: 'free',
    },
    bio: {
      links: [
        {
          id: 'link-1',
          user_id: mockUserId,
          title: 'My Website',
          url: 'https://johndoe.com',
          sort_order: 1,
          is_active: true,
          created_at: '2026-08-01T00:00:00Z',
          animation_type: null,
          clicks: 0,
          display_mode: 'standard',
          expires_at: null,
          icon_url: null,
          is_folder: false,
          is_header: false,
          is_pinned: false,
          is_sensitive: false,
          last_clicked_at: null,
          parent_id: null,
          scheduled_at: null,
          short_id: 1,
        },
      ],
      subscribers: [
        {
          id: 'sub-1',
          profile_id: mockUserId,
          email: 'fan@example.com',
          created_at: '2026-08-05T00:00:00Z',
          source_url: 'https://kytbox.com/johndoe',
        },
      ],
      domains: [
        {
          id: 'dom-1',
          user_id: mockUserId,
          profile_id: mockUserId,
          domain: 'links.johndoe.com',
          status: 'verified',
          created_at: '2026-08-05T00:00:00Z',
          updated_at: '2026-08-05T00:00:00Z',
          verification_token: 'kytbox_txt_123',
        },
      ],
    },
    cashflow: {
      cashflows: [
        {
          id: 'cf-1',
          user_id: mockUserId,
          title: 'Personal Budget',
          created_at: '2026-08-01T00:00:00Z',
          is_public: false,
        },
      ],
      entries: [
        {
          id: 'entry-1',
          cashflow_id: 'cf-1',
          description: 'Grocery Store',
          amount: 150,
          type: 'expense',
          category: 'Food',
          date: '2026-08-10',
          created_at: '2026-08-10T00:00:00Z',
          goal_id: null,
          is_recurring: false,
          receipt_url: null,
          recurrence_interval: null,
          tags: ['groceries'],
          yearly_calculation: null,
        },
      ],
      split_entries: [
        {
          id: 'split-1',
          parent_entry_id: 'entry-1',
          item_name: 'Organic Milk',
          category: 'Food',
          amount: 50,
          created_at: '2026-08-10T00:00:00Z',
        },
      ],
      budgets: [
        {
          id: 'budget-1',
          cashflow_id: 'cf-1',
          category: 'Food',
          amount: 500,
          period: 'monthly',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: null,
        },
      ],
      goals: [
        {
          id: 'goal-1',
          cashflow_id: 'cf-1',
          title: 'Emergency Fund',
          target_amount: 10000,
          deadline: '2026-12-31',
          is_deleted: false,
          created_at: '2026-08-01T00:00:00Z',
        },
      ],
      tags: [
        {
          id: 'tag-1',
          user_id: mockUserId,
          cashflow_id: 'cf-1',
          name: 'groceries',
          color_index: 1,
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
      shares: [
        {
          id: 'share-1',
          cashflow_id: 'cf-1',
          email: 'partner@example.com',
          role: 'edit',
          created_at: '2026-08-01T00:00:00Z',
          created_via_public_access: false,
          is_included_in_totals: true,
          is_pinned: false,
        },
      ],
    },
    list: {
      lists: [
        {
          id: 'list-1',
          user_id: mockUserId,
          title: 'Project Roadmap',
          type: 'kanban',
          description: 'Q3 deliverables',
          is_public: false,
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
      columns: [
        {
          id: 'col-1',
          list_id: 'list-1',
          title: 'In Progress',
          sort_order: 1,
          is_done_column: false,
          created_at: '2026-08-01T00:00:00Z',
        },
      ],
      items: [
        {
          id: 'item-1',
          list_id: 'list-1',
          column_id: 'col-1',
          title: 'Build GDPR Data Export',
          description: 'Article 20 portability archive',
          sort_order: 1,
          is_completed: false,
          priority: 'high',
          due_date: '2026-08-31',
          reminder_sent: false,
          recurrence_rule: null,
          metadata: null,
          created_at: '2026-08-25T00:00:00Z',
        },
      ],
      subtasks: [
        {
          id: 'subtask-1',
          item_id: 'item-1',
          title: 'Add zip streamer',
          is_completed: true,
          position: 1,
          created_at: '2026-08-25T00:00:00Z',
        },
      ],
    },
    invoices: {
      invoices: [
        {
          id: 'inv-1',
          user_id: mockUserId,
          invoice_number: 'INV-2026-001',
          client_name: 'Acme Corp',
          client_email: 'billing@acme.com',
          client_address: null,
          sender_name: 'John Doe',
          sender_email: 'john@example.com',
          sender_address: null,
          issue_date: '2026-08-15',
          due_date: '2026-09-15',
          currency: 'USD',
          status: 'sent',
          subtotal: 1000,
          tax_rate: 10,
          tax_amount: 100,
          discount_amount: 0,
          total_amount: 1100,
          notes: 'Thanks for your business',
          payment_info: null,
          include_client_signature: false,
          include_issuer_signature: false,
          signatory_name: null,
          signed_date: null,
          created_at: '2026-08-15T00:00:00Z',
          updated_at: '2026-08-15T00:00:00Z',
        },
      ],
      items: [
        {
          id: 'inv-item-1',
          invoice_id: 'inv-1',
          description: 'Consulting Services',
          quantity: 10,
          unit_price: 100,
          amount: 1000,
          sort_order: 1,
          created_at: '2026-08-15T00:00:00Z',
        },
      ],
    },
  };

  it('generates a valid ZIP archive containing all domain JSON files and README', async () => {
    const zipBytes = await generateExportZip(mockExportData);
    expect(zipBytes).toBeInstanceOf(Uint8Array);
    expect(zipBytes.length).toBeGreaterThan(100);

    // Unpack ZIP to verify content
    const unzipped = await JSZip.loadAsync(zipBytes);

    const fileNames = Object.keys(unzipped.files);
    expect(fileNames).toContain('README.txt');
    expect(fileNames).toContain('manifest.json');
    expect(fileNames).toContain('profile.json');
    expect(fileNames).toContain('bio.json');
    expect(fileNames).toContain('cashflow.json');
    expect(fileNames).toContain('list.json');
    expect(fileNames).toContain('invoices.json');
    expect(fileNames).not.toContain('support.json');
    expect(fileNames).not.toContain('notifications.json');

    // Verify manifest JSON content
    const manifestStr = await unzipped.file('manifest.json')!.async('string');
    const parsedManifest = JSON.parse(manifestStr);
    expect(parsedManifest.app).toBe('Kytbox');
    expect(parsedManifest.version).toBe('2.0.0');
    expect(parsedManifest.user_id).toBe(mockUserId);
    expect(parsedManifest.summary.profile).toBe(1);

    // Verify profile JSON content
    const profileStr = await unzipped.file('profile.json')!.async('string');
    const parsedProfile = JSON.parse(profileStr);
    expect(parsedProfile.username).toBe('johndoe');

    // Verify cashflow JSON content
    const cashflowStr = await unzipped.file('cashflow.json')!.async('string');
    const parsedCashflow = JSON.parse(cashflowStr);
    expect(parsedCashflow.cashflows[0].title).toBe('Personal Budget');
    expect(parsedCashflow.entries[0].amount).toBe(150);

    // Verify list JSON content
    const listStr = await unzipped.file('list.json')!.async('string');
    const parsedList = JSON.parse(listStr);
    expect(parsedList.lists[0].title).toBe('Project Roadmap');
    expect(parsedList.items[0].title).toBe('Build GDPR Data Export');

    // Verify README.txt contains header and user id
    const readmeStr = await unzipped.file('README.txt')!.async('string');
    expect(readmeStr).toContain('KYTBOX DATA ARCHIVE');
    expect(readmeStr).toContain(mockUserId);
  });
});
