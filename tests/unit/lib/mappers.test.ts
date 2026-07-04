import {
  mapProfileToDTO,
  mapLinkToDTO,
  mapCashflowToDTO,
  mapCashflowEntryToDTO,
  mapCashflowShareToDTO,
  mapCashflowWithSummaryToDTO,
  mapBudgetToDTO,
  mapListToDTO,
  mapListWithSummaryToDTO,
  mapListColumnToDTO,
  mapListItemToDTO,
} from '@/lib/mappers';
import type {
  Profile,
  Link,
  Cashflow,
  CashflowEntry,
  CashflowShare,
  CashflowBudget,
  CashflowWithSummary,
  List,
  ListColumn,
  ListItem,
  ListWithSummary,
} from '@/types/database';

// Helper to inject bad data into a typed fixture without using `as` casts inline.
// This is the only sanctioned escape hatch for testing Zod .catch() degradation.
function corrupt<T>(value: T, overrides: Record<string, unknown>): T {
  return { ...value, ...overrides };
}

// ==========================================
// FIXTURES — typed against exact DB Row types
// ==========================================

const baseProfile: Profile = {
  id: 'user-1',
  username: 'johndoe',
  display_name: 'John Doe',
  bio: 'Hello world',
  avatar_url: 'https://cdn.example.com/avatar.png',
  tier: 'pro',
  role: 'user',
  theme_name: 'dark',
  button_style: 'solid',
  button_shape: 'rounded',
  social_links: {},
  custom_theme: null,
  default_currency: 'USD',
  created_at: '2026-01-01T00:00:00Z',
};

const baseLink: Link = {
  id: 'link-1',
  user_id: 'user-1',
  title: 'My Site',
  url: 'https://example.com',
  is_active: true,
  sort_order: 1,
  is_folder: false,
  parent_id: null,
  clicks: 42,
  animation_type: 'slide',
  short_id: 1,
  last_clicked_at: null,
  created_at: '2026-01-01T00:00:00Z',
};

const baseCashflow: Cashflow = {
  id: 'cf-1',
  title: 'Monthly Budget',
  is_public: false,
  user_id: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
};

const baseCashflowEntry: CashflowEntry = {
  id: 'entry-1',
  cashflow_id: 'cf-1',
  description: 'Salary',
  amount: 5000,
  type: 'income',
  category: 'Work',
  date: '2026-03-01',
  is_recurring: false,
  recurrence_interval: null,
  yearly_calculation: null,
  created_at: '2026-03-01T00:00:00Z',
};

const baseShare: CashflowShare = {
  id: 'share-1',
  cashflow_id: 'cf-1',
  role: 'edit',
  email: 'collaborator@example.com',
  created_at: '2026-01-01T00:00:00Z',
  created_via_public_access: null,
  is_included_in_totals: null,
  is_pinned: null,
};

const baseBudget: CashflowBudget = {
  id: 'budget-1',
  cashflow_id: 'cf-1',
  category: 'Food',
  amount: 500,
  period: 'monthly',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: null,
};

const baseSummary: CashflowWithSummary = {
  id: 'cf-1',
  title: 'Monthly Budget',
  is_public: false,
  user_id: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
  entry_count: 10,
  income: 5000,
  expense: 3000,
  balance: 2000,
  entries: [],
};

// ==========================================
// mapProfileToDTO
// ==========================================

describe('mapProfileToDTO', () => {
  it('maps required fields correctly', () => {
    const dto = mapProfileToDTO(baseProfile);
    expect(dto.id).toBe('user-1');
    expect(dto.username).toBe('johndoe');
    expect(dto.full_name).toBe('John Doe');
    expect(dto.bio).toBe('Hello world');
    expect(dto.avatar_url).toBe('https://cdn.example.com/avatar.png');
  });

  it('does NOT expose sensitive DB fields to the client', () => {
    const dto = mapProfileToDTO(baseProfile);
    const keys = Object.keys(dto);
    expect(keys).not.toContain('tier');
    expect(keys).not.toContain('role');
    expect(keys).not.toContain('social_links');
    expect(keys).not.toContain('theme_name');
    expect(keys).not.toContain('created_at');
  });

  it('maps null display_name to null full_name', () => {
    const dto = mapProfileToDTO({ ...baseProfile, display_name: null });
    expect(dto.full_name).toBeNull();
  });
});

// ==========================================
// mapLinkToDTO
// ==========================================

describe('mapLinkToDTO', () => {
  it('maps required fields correctly', () => {
    const dto = mapLinkToDTO(baseLink);
    expect(dto.id).toBe('link-1');
    expect(dto.title).toBe('My Site');
    expect(dto.url).toBe('https://example.com');
    expect(dto.is_active).toBe(true);
    expect(dto.is_folder).toBe(false);
  });

  it('does NOT expose user_id or short_id to the client', () => {
    const dto = mapLinkToDTO(baseLink);
    const keys = Object.keys(dto);
    expect(keys).not.toContain('user_id');
    expect(keys).not.toContain('short_id');
  });

  it('coerces null url to "#"', () => {
    // Link.url is non-nullable in the DB type, but the mapper guards against null
    // at runtime (defensive coding). corrupt() lets us test that path safely.
    const dto = mapLinkToDTO(corrupt(baseLink, { url: null }));
    expect(dto.url).toBe('#');
  });

  it('coerces null is_active to false', () => {
    const dto = mapLinkToDTO({ ...baseLink, is_active: null });
    expect(dto.is_active).toBe(false);
  });

  it('coerces null sort_order to 0', () => {
    const dto = mapLinkToDTO({ ...baseLink, sort_order: null });
    expect(dto.sort_order).toBe(0);
  });

  it('picks child_count from nested children array', () => {
    const dto = mapLinkToDTO({ ...baseLink, children: [{ count: 5 }] });
    expect(dto.child_count).toBe(5);
  });

  it('falls back to child_count field if children array absent', () => {
    const dto = mapLinkToDTO({ ...baseLink, child_count: 3 });
    expect(dto.child_count).toBe(3);
  });

  it('returns undefined child_count if neither source is present', () => {
    const dto = mapLinkToDTO(baseLink);
    expect(dto.child_count).toBeUndefined();
  });
});

// ==========================================
// mapCashflowToDTO
// ==========================================

describe('mapCashflowToDTO', () => {
  it('maps all fields correctly', () => {
    const dto = mapCashflowToDTO(baseCashflow);
    expect(dto.id).toBe('cf-1');
    expect(dto.title).toBe('Monthly Budget');
    expect(dto.is_public).toBe(false);
    expect(dto.user_id).toBe('user-1');
  });

  it('coerces null is_public to false', () => {
    const dto = mapCashflowToDTO({ ...baseCashflow, is_public: null });
    expect(dto.is_public).toBe(false);
  });
});

// ==========================================
// mapCashflowEntryToDTO
// ==========================================

describe('mapCashflowEntryToDTO', () => {
  it('maps a standard income entry correctly', () => {
    const dto = mapCashflowEntryToDTO(baseCashflowEntry);
    expect(dto.id).toBe('entry-1');
    expect(dto.amount).toBe(5000);
    expect(dto.type).toBe('income');
    expect(dto.is_recurring).toBe(false);
    expect(dto.recurrence_interval).toBeNull();
  });

  it('defaults is_recurring to false when null', () => {
    const dto = mapCashflowEntryToDTO({ ...baseCashflowEntry, is_recurring: null });
    expect(dto.is_recurring).toBe(false);
  });

  it('preserves valid recurrence_interval', () => {
    const dto = mapCashflowEntryToDTO({ ...baseCashflowEntry, recurrence_interval: 'monthly' });
    expect(dto.recurrence_interval).toBe('monthly');
  });

  it('falls back to null for invalid recurrence_interval (Zod .catch)', () => {
    // corrupt() is used to simulate bad data coming from the DB without inline casts
    const dto = mapCashflowEntryToDTO(corrupt(baseCashflowEntry, { recurrence_interval: 'weekly' }));
    expect(dto.recurrence_interval).toBeNull();
  });

  it('preserves valid yearly_calculation', () => {
    const dto = mapCashflowEntryToDTO({ ...baseCashflowEntry, yearly_calculation: 'prorated' });
    expect(dto.yearly_calculation).toBe('prorated');
  });

  it('falls back to null for invalid yearly_calculation (Zod .catch)', () => {
    const dto = mapCashflowEntryToDTO(corrupt(baseCashflowEntry, { yearly_calculation: 'invalid' }));
    expect(dto.yearly_calculation).toBeNull();
  });
});

// ==========================================
// mapCashflowShareToDTO
// ==========================================

describe('mapCashflowShareToDTO', () => {
  it('transforms "edit" role to "editor"', () => {
    expect(mapCashflowShareToDTO(baseShare).role).toBe('editor');
  });

  it('transforms non-edit roles to "viewer"', () => {
    expect(mapCashflowShareToDTO({ ...baseShare, role: 'read' }).role).toBe('viewer');
  });

  it('maps email correctly', () => {
    expect(mapCashflowShareToDTO(baseShare).email).toBe('collaborator@example.com');
  });
});

// ==========================================
// mapCashflowWithSummaryToDTO
// ==========================================

describe('mapCashflowWithSummaryToDTO', () => {
  it('maps summary numeric fields correctly', () => {
    const dto = mapCashflowWithSummaryToDTO(baseSummary);
    expect(dto.entryCount).toBe(10);
    expect(dto.income).toBe(5000);
    expect(dto.expense).toBe(3000);
    expect(dto.balance).toBe(2000);
  });

  it('defaults nullish summary fields to 0', () => {
    const dto = mapCashflowWithSummaryToDTO({
      ...baseSummary,
      income: null,
      expense: null,
      balance: null,
      entry_count: null,
    });
    expect(dto.income).toBe(0);
    expect(dto.expense).toBe(0);
    expect(dto.balance).toBe(0);
    expect(dto.entryCount).toBe(0);
  });

  it('maps nested entries through mapCashflowEntryToDTO', () => {
    const dto = mapCashflowWithSummaryToDTO({ ...baseSummary, entries: [baseCashflowEntry] });
    expect(dto.entries).toHaveLength(1);
    expect(dto.entries[0].description).toBe('Salary');
  });

  it('defaults entries to empty array when absent', () => {
    const dto = mapCashflowWithSummaryToDTO({ ...baseSummary, entries: undefined });
    expect(dto.entries).toEqual([]);
  });
});

// ==========================================
// mapBudgetToDTO
// ==========================================

describe('mapBudgetToDTO', () => {
  it('maps budget fields correctly', () => {
    const dto = mapBudgetToDTO(baseBudget);
    expect(dto.id).toBe('budget-1');
    expect(dto.category).toBe('Food');
    expect(dto.amount).toBe(500);
    expect(dto.period).toBe('monthly');
  });

  it('coerces string-like amount to number via Number()', () => {
    const dto = mapBudgetToDTO(corrupt(baseBudget, { amount: '750' }));
    expect(dto.amount).toBe(750);
  });
});

// ==========================================
// List Fixtures
// ==========================================

const baseList: List = {
  id: 'list-1',
  user_id: 'user-1',
  title: 'My List',
  description: 'A test list',
  type: 'todo',
  is_public: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const baseListSummary: ListWithSummary = {
  id: 'list-1',
  user_id: 'user-1',
  title: 'My List',
  description: 'A test list',
  type: 'todo',
  is_public: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  item_count: 5,
  completed_count: 2,
};

const baseListColumn: ListColumn = {
  id: 'col-1',
  list_id: 'list-1',
  title: 'Todo',
  sort_order: 1024,
  is_done_column: false,
  created_at: '2026-01-01T00:00:00Z',
};

const baseListItem: ListItem = {
  id: 'item-1',
  list_id: 'list-1',
  column_id: 'col-1',
  title: 'Task 1',
  description: 'Detail 1',
  is_completed: false,
  sort_order: 1024,
  metadata: { price: 99.99, currency: 'USD', purchase_url: 'https://example.com' },
  created_at: '2026-01-01T00:00:00Z',
};

// ==========================================
// mapListToDTO
// ==========================================

describe('mapListToDTO', () => {
  it('maps list fields correctly', () => {
    const dto = mapListToDTO(baseList);
    expect(dto.id).toBe('list-1');
    expect(dto.title).toBe('My List');
    expect(dto.description).toBe('A test list');
    expect(dto.type).toBe('todo');
    expect(dto.is_public).toBe(false);
    expect(dto.user_id).toBe('user-1');
    expect(dto.created_at).toBe('2026-01-01T00:00:00Z');
    expect(dto.updated_at).toBe('2026-01-01T00:00:00Z');
    expect(dto.item_count).toBe(0);
    expect(dto.completed_count).toBe(0);
  });

  it('safely parses invalid list type as todo via catch() fallback', () => {
    const dto = mapListToDTO(corrupt(baseList, { type: 'invalid_type' }));
    expect(dto.type).toBe('todo');
  });
});

// ==========================================
// mapListWithSummaryToDTO
// ==========================================

describe('mapListWithSummaryToDTO', () => {
  it('maps list summary fields correctly', () => {
    const dto = mapListWithSummaryToDTO(baseListSummary);
    expect(dto.id).toBe('list-1');
    expect(dto.title).toBe('My List');
    expect(dto.description).toBe('A test list');
    expect(dto.type).toBe('todo');
    expect(dto.is_public).toBe(false);
    expect(dto.user_id).toBe('user-1');
    expect(dto.created_at).toBe('2026-01-01T00:00:00Z');
    expect(dto.updated_at).toBe('2026-01-01T00:00:00Z');
    expect(dto.item_count).toBe(5);
    expect(dto.completed_count).toBe(2);
  });

  it('handles nullable database view columns safely', () => {
    const nullableSummary: ListWithSummary = {
      id: 'list-1',
      user_id: 'user-1',
      title: 'My List',
      description: null,
      type: 'todo',
      is_public: null,
      created_at: null,
      updated_at: null,
      item_count: null,
      completed_count: null,
    };
    const dto = mapListWithSummaryToDTO(nullableSummary);
    expect(dto.description).toBeNull();
    expect(dto.is_public).toBe(false);
    expect(dto.item_count).toBe(0);
    expect(dto.completed_count).toBe(0);
  });
});

// ==========================================
// mapListColumnToDTO
// ==========================================

describe('mapListColumnToDTO', () => {
  it('maps list column fields correctly', () => {
    const dto = mapListColumnToDTO(baseListColumn);
    expect(dto.id).toBe('col-1');
    expect(dto.list_id).toBe('list-1');
    expect(dto.title).toBe('Todo');
    expect(dto.sort_order).toBe(1024);
    expect(dto.is_done_column).toBe(false);
  });
});

// ==========================================
// mapListItemToDTO
// ==========================================

describe('mapListItemToDTO', () => {
  it('maps list item fields correctly', () => {
    const dto = mapListItemToDTO(baseListItem);
    expect(dto.id).toBe('item-1');
    expect(dto.list_id).toBe('list-1');
    expect(dto.column_id).toBe('col-1');
    expect(dto.title).toBe('Task 1');
    expect(dto.description).toBe('Detail 1');
    expect(dto.is_completed).toBe(false);
    expect(dto.sort_order).toBe(1024);
    expect(dto.metadata).toEqual({
      price: 99.99,
      currency: 'USD',
      purchase_url: 'https://example.com',
    });
    expect(dto.created_at).toBe('2026-01-01T00:00:00Z');
  });

  it('handles null/invalid metadata field by falling back to empty object', () => {
    const dto = mapListItemToDTO(corrupt(baseListItem, { metadata: null }));
    expect(dto.metadata).toEqual({});
  });
});

