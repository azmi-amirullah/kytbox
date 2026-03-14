import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  addLinkSchema,
  updateLinkSchema,
  moveToFolderSchema,
  cashflowEntrySchema,
  cashflowBudgetSchema,
  supportTicketSchema,
  bioTabSchema,
  ticketStatusSchema,
  ticketCategorySchema,
} from '@/lib/validation.schemas';

// ==========================================
// AUTH SCHEMAS
// ==========================================

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('signupSchema', () => {
  it('accepts valid signup data', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      username: 'johndoe',
    });
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 6 characters', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: '123',
      username: 'johndoe',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Password must be at least 6 characters');
  });

  it('rejects username shorter than 3 characters', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      username: 'ab',
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts email only', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com', username: '' });
    expect(result.success).toBe(true);
  });

  it('accepts username only', () => {
    const result = forgotPasswordSchema.safeParse({ email: '', username: 'johndoe' });
    expect(result.success).toBe(true);
  });

  it('rejects when both email and username are empty', () => {
    const result = forgotPasswordSchema.safeParse({ email: '', username: '' });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// BIO SCHEMAS
// ==========================================

describe('bioTabSchema', () => {
  it('accepts "links"', () => expect(bioTabSchema.parse('links')).toBe('links'));
  it('accepts "appearance"', () => expect(bioTabSchema.parse('appearance')).toBe('appearance'));
  it('falls back to "links" for unknown values', () => expect(bioTabSchema.parse('invalid')).toBe('links'));
});

describe('addLinkSchema', () => {
  it('accepts a valid link', () => {
    const result = addLinkSchema.safeParse({ title: 'My Site', url: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = addLinkSchema.safeParse({ title: '', url: 'https://example.com' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Title is required');
  });

  it('accepts a link with no URL (folder case)', () => {
    const result = addLinkSchema.safeParse({ title: 'My Folder' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid parentId format', () => {
    const result = addLinkSchema.safeParse({ title: 'Link', parentId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid UUID as parentId', () => {
    const result = addLinkSchema.safeParse({
      title: 'Link',
      parentId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateLinkSchema', () => {
  it('accepts valid update data', () => {
    const result = updateLinkSchema.safeParse({
      title: 'Updated Title',
      url: 'https://new.com',
      isFolder: 'false',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = updateLinkSchema.safeParse({ title: '', isFolder: 'false' });
    expect(result.success).toBe(false);
  });
});

describe('moveToFolderSchema', () => {
  it('accepts a valid linkId and no parentId', () => {
    const result = moveToFolderSchema.safeParse({
      linkId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid linkId', () => {
    const result = moveToFolderSchema.safeParse({ linkId: 'bad-id' });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// CASHFLOW SCHEMAS
// ==========================================

describe('cashflowEntrySchema', () => {
  const validEntry = {
    description: 'Salary',
    amount: '5000',
    type: 'income',
    date: '2026-03-12',
  };

  it('accepts a valid income entry', () => {
    const result = cashflowEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
    expect(result.data?.amount).toBe(5000);
  });

  it('accepts a valid expense entry', () => {
    const result = cashflowEntrySchema.safeParse({ ...validEntry, type: 'expense' });
    expect(result.success).toBe(true);
  });

  it('rejects negative amount', () => {
    const result = cashflowEntrySchema.safeParse({ ...validEntry, amount: '-100' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Amount must be positive');
  });

  it('rejects zero amount', () => {
    const result = cashflowEntrySchema.safeParse({ ...validEntry, amount: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = cashflowEntrySchema.safeParse({ ...validEntry, date: '12/03/2026' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Invalid date format');
  });

  it('rejects invalid entry type', () => {
    const result = cashflowEntrySchema.safeParse({ ...validEntry, type: 'savings' });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = cashflowEntrySchema.safeParse({ ...validEntry, description: '' });
    expect(result.success).toBe(false);
  });

  it('coerces string amount to number', () => {
    const result = cashflowEntrySchema.safeParse({ ...validEntry, amount: '1500.50' });
    expect(result.success).toBe(true);
    expect(result.data?.amount).toBe(1500.5);
  });

  it('defaults is_recurring to false', () => {
    const result = cashflowEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
    expect(result.data?.is_recurring).toBe(false);
  });

  it('handles is_recurring=true as string', () => {
    const result = cashflowEntrySchema.safeParse({ ...validEntry, is_recurring: 'true' });
    expect(result.success).toBe(true);
    expect(result.data?.is_recurring).toBe(true);
  });
});

describe('cashflowBudgetSchema', () => {
  const validBudget = {
    cashflowId: '123e4567-e89b-12d3-a456-426614174000',
    category: 'Food',
    amount: '500',
  };

  it('accepts valid budget data', () => {
    const result = cashflowBudgetSchema.safeParse(validBudget);
    expect(result.success).toBe(true);
  });

  it('rejects negative budget amount', () => {
    const result = cashflowBudgetSchema.safeParse({ ...validBudget, amount: '-50' });
    expect(result.success).toBe(false);
  });

  it('rejects empty category', () => {
    const result = cashflowBudgetSchema.safeParse({ ...validBudget, category: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid cashflowId', () => {
    const result = cashflowBudgetSchema.safeParse({ ...validBudget, cashflowId: 'bad' });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// SUPPORT SCHEMAS
// ==========================================

describe('supportTicketSchema', () => {
  const validTicket = {
    subject: 'My app is broken',
    category: 'bug',
    message: 'Everything crashes when I open the dashboard.',
  };

  it('accepts a valid ticket', () => {
    expect(supportTicketSchema.safeParse(validTicket).success).toBe(true);
  });

  it('rejects short subject', () => {
    const result = supportTicketSchema.safeParse({ ...validTicket, subject: 'Foo' });
    expect(result.success).toBe(false);
  });

  it('rejects short message', () => {
    const result = supportTicketSchema.safeParse({ ...validTicket, message: 'Help' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = supportTicketSchema.safeParse({ ...validTicket, category: 'random' });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// ENUM SCHEMAS WITH .catch()
// ==========================================

describe('ticketStatusSchema', () => {
  it('parses valid status', () => expect(ticketStatusSchema.parse('resolved')).toBe('resolved'));
  it('falls back to "open" for invalid status', () => expect(ticketStatusSchema.parse('unknown')).toBe('open'));
});

describe('ticketCategorySchema', () => {
  it('parses valid category', () => expect(ticketCategorySchema.parse('billing')).toBe('billing'));
  it('falls back to "general" for invalid category', () => expect(ticketCategorySchema.parse('????')).toBe('general'));
});
