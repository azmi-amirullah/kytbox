import {
  validateUsername,
  generateUsernameFromEmail,
  RESERVED_USERNAMES,
} from '@/lib/username';

describe('validateUsername', () => {
  // --- Valid cases ---
  it('accepts a simple valid username', () => {
    expect(validateUsername('johndoe').valid).toBe(true);
  });

  it('accepts username with hyphen in the middle', () => {
    expect(validateUsername('john-doe').valid).toBe(true);
  });

  it('accepts numbers in username', () => {
    expect(validateUsername('user123').valid).toBe(true);
  });

  it('accepts 3-character minimum', () => {
    expect(validateUsername('abc').valid).toBe(true);
  });

  it('accepts 20-character maximum', () => {
    expect(validateUsername('a'.repeat(20)).valid).toBe(true);
  });

  // --- Invalid cases ---
  it('rejects usernames shorter than 3 characters', () => {
    const result = validateUsername('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 3 characters');
  });

  it('rejects usernames longer than 20 characters', () => {
    const result = validateUsername('a'.repeat(21));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most 20 characters');
  });

  it('rejects username starting with a hyphen', () => {
    expect(validateUsername('-johndoe').valid).toBe(false);
  });

  it('rejects username ending with a hyphen', () => {
    expect(validateUsername('johndoe-').valid).toBe(false);
  });

  it('rejects consecutive hyphens', () => {
    const result = validateUsername('john--doe');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('consecutive hyphens');
  });

  it('normalizes uppercase letters (accepts because it lowercases first)', () => {
    // validateUsername lowercases input before checking — uppercase is treated as valid
    expect(validateUsername('JohnDoe').valid).toBe(true);
  });

  it('rejects spaces', () => {
    expect(validateUsername('john doe').valid).toBe(false);
  });

  it('rejects special characters', () => {
    expect(validateUsername('john@doe').valid).toBe(false);
  });

  // --- Reserved usernames ---
  it('rejects all reserved usernames', () => {
    for (const reserved of RESERVED_USERNAMES) {
      const result = validateUsername(reserved);
      expect(result.valid, `Expected "${reserved}" to be invalid`).toBe(false);
    }
  });

  it('is case-insensitive for reserved usernames', () => {
    expect(validateUsername('ADMIN').valid).toBe(false);
    expect(validateUsername('Admin').valid).toBe(false);
  });
});

describe('generateUsernameFromEmail', () => {
  it('generates a valid username from a simple email', () => {
    expect(generateUsernameFromEmail('johndoe@example.com')).toBe('johndoe');
  });

  it('replaces dots with hyphens', () => {
    const result = generateUsernameFromEmail('john.doe@example.com');
    expect(result).toBe('john-doe');
  });

  it('lowercases the result', () => {
    expect(generateUsernameFromEmail('JohnDoe@example.com')).toBe('johndoe');
  });

  it('removes consecutive hyphens', () => {
    const result = generateUsernameFromEmail('john..doe@example.com');
    expect(result).not.toContain('--');
  });

  it('trims to 20 characters max', () => {
    const result = generateUsernameFromEmail('averylongusernameprefix@example.com');
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('pads short results to minimum 3 characters', () => {
    const result = generateUsernameFromEmail('ab@example.com');
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it('does not produce trailing hyphens after truncation', () => {
    const result = generateUsernameFromEmail('averylongusernameprefix@example.com');
    expect(result.endsWith('-')).toBe(false);
  });
});
