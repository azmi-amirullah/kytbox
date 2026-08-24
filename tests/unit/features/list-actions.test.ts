import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthenticatedUserWithRateLimit: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth-with-rate-limit', () => ({
  getAuthenticatedUserWithRateLimit: mocks.getAuthenticatedUserWithRateLimit,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/features/notifications', () => ({
  createNotification: vi.fn(),
}));

type QueryError = { message: string };

type QueryResult = {
  data: unknown;
  error: QueryError | null;
  count?: number | null;
};

class FakeQuery {
  public readonly updates: Record<string, unknown>[];

  public readonly deletes: number[];

  public readonly filters: { column: string; value: unknown }[];

  public constructor(
    private readonly result: QueryResult,
    updates: Record<string, unknown>[],
    deletes: number[],
  ) {
    this.updates = updates;
    this.deletes = deletes;
    this.filters = [];
  }

  public select(..._columns: readonly unknown[]): FakeQuery {
    void _columns;
    return this;
  }

  public insert(_payload: unknown): FakeQuery {
    void _payload;
    return this;
  }

  public update(payload: Record<string, unknown>): FakeQuery {
    this.updates.push(payload);
    return this;
  }

  public delete(): FakeQuery {
    this.deletes.push(1);
    return this;
  }

  public eq(column: string, value: unknown): FakeQuery {
    this.filters.push({ column, value });
    return this;
  }

  public in(_column: string, _values: readonly unknown[]): FakeQuery {
    void _column;
    void _values;
    return this;
  }

  public order(_column: string, _options?: unknown): FakeQuery {
    void _column;
    void _options;
    return this;
  }

  public limit(_count: number): FakeQuery {
    void _count;
    return this;
  }

  public single(): Promise<QueryResult> {
    return Promise.resolve(this.result);
  }

  public maybeSingle(): Promise<QueryResult> {
    return Promise.resolve(this.result);
  }

  public then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

type FakeSupabase = {
  from: (table: string) => FakeQuery;
  rpc: (_name: string, _args: Record<string, unknown>) => Promise<QueryResult>;
};

type FakeSupabaseState = {
  client: FakeSupabase;
  updates: Record<string, unknown>[];
  deletes: number[];
};

function createFakeSupabase(
  results: Record<string, QueryResult>,
): FakeSupabaseState {
  const updates: Record<string, unknown>[] = [];
  const deletes: number[] = [];

  const client: FakeSupabase = {
    from: (table) =>
      new FakeQuery(
        results[table] ?? { data: null, error: { message: 'Missing table result' } },
        updates,
        deletes,
      ),
    rpc: async () => ({ data: null, error: null }),
  };

  return { client, updates, deletes };
}

const userId = '11111111-1111-4111-8111-111111111111';
const itemId = '22222222-2222-4222-8222-222222222222';
const columnId = '33333333-3333-4333-8333-333333333333';
const otherColumnId = '44444444-4444-4444-8444-444444444444';
const listId = '55555555-5555-4555-8555-555555555555';
const otherListId = '66666666-6666-4666-8666-666666666666';

let actions: typeof import('@/features/list/actions');

async function loadActions() {
  if (!actions) {
    actions = await import('@/features/list/actions');
  }
  return actions;
}

function configureAuth(results: Record<string, QueryResult>): FakeSupabaseState {
  const state = createFakeSupabase(results);
  mocks.getAuthenticatedUserWithRateLimit.mockResolvedValue({
    user: { id: userId },
    supabase: state.client,
  });
  return state;
}

beforeAll(async () => {
  actions = await import('@/features/list/actions');
}, 30000);

beforeEach(() => {
  mocks.getAuthenticatedUserWithRateLimit.mockReset();
  mocks.revalidatePath.mockReset();
});

describe('List server-action security boundaries', () => {
  it('rejects malformed move input before touching the authenticated client', async () => {
    const { moveItem } = await loadActions();

    const result = await moveItem('not-an-id', columnId, 0, false);

    expect(result).toEqual({ error: 'Invalid item ID' });
    expect(mocks.getAuthenticatedUserWithRateLimit).not.toHaveBeenCalled();
  }, 30000);

  it('rejects a destination column from another list', async () => {
    const { moveItem } = await loadActions();
    const state = configureAuth({
      list_items: {
        data: { id: itemId, list_id: listId },
        error: null,
      },
      lists: {
        data: { id: listId, type: 'todo' },
        error: null,
      },
      list_columns: {
        data: {
          id: otherColumnId,
          list_id: otherListId,
          is_done_column: false,
        },
        error: null,
      },
    });

    const result = await moveItem(itemId, otherColumnId, 1, false);

    expect(result).toEqual({ error: 'Item or column not found' });
    expect(state.updates).toHaveLength(0);
  });

  it('preserves sticky completion when leaving a non-done destination column', async () => {
    const { moveItem } = await loadActions();
    const state = configureAuth({
      list_items: {
        data: { id: itemId, list_id: listId },
        error: null,
      },
      lists: {
        data: { id: listId, type: 'todo' },
        error: null,
      },
      list_columns: {
        data: { id: columnId, list_id: listId, is_done_column: false },
        error: null,
      },
    });

    const result = await moveItem(itemId, columnId, 2, true);

    expect(result).toEqual({ success: true });
    expect(state.updates).toEqual([
      { column_id: columnId, sort_order: 2 },
    ]);
  });

  it('marks an item complete from the server-side destination column state', async () => {
    const { moveItem } = await loadActions();
    const state = configureAuth({
      list_items: {
        data: { id: itemId, list_id: listId },
        error: null,
      },
      lists: {
        data: { id: listId, type: 'todo' },
        error: null,
      },
      list_columns: {
        data: { id: columnId, list_id: listId, is_done_column: true },
        error: null,
      },
    });

    const result = await moveItem(itemId, columnId, 3, false);

    expect(result).toEqual({ success: true });
    expect(state.updates).toEqual([
      { column_id: columnId, sort_order: 3, is_completed: true },
    ]);
  });

  it('protects the final column from deletion', async () => {
    const { deleteColumn } = await loadActions();
    const state = configureAuth({
      list_columns: {
        data: { id: columnId, list_id: listId, is_done_column: false },
        error: null,
        count: 1,
      },
      lists: {
        data: { id: listId, type: 'todo' },
        error: null,
      },
    });

    const result = await deleteColumn(columnId);

    expect(result).toEqual({ error: 'Cannot delete the last column' });
    expect(state.deletes).toHaveLength(0);
  });

  it('updates task due date and resets reminder flag', async () => {
    const { setCardDueDate } = await loadActions();
    const state = configureAuth({
      list_items: {
        data: { id: itemId, list_id: listId },
        error: null,
      },
      lists: {
        data: { id: listId, type: 'todo' },
        error: null,
      },
    });

    const result = await setCardDueDate(itemId, '2026-08-30');

    expect(result).toEqual({ success: true });
    expect(state.updates).toEqual([
      { due_date: '2026-08-30', reminder_sent: false },
    ]);
  });
});
