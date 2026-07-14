import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/features/auth/schemas.client';

describe('client loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'password' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'password' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('client signupSchema', () => {
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
  });

  it('rejects username shorter than 3 characters', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      username: 'ab',
    });
    expect(result.success).toBe(false);
  });

  it('rejects username with invalid characters', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      username: 'john_doe!',
    });
    expect(result.success).toBe(false);
  });
});

describe('client forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'notanemail' });
    expect(result.success).toBe(false);
  });
});

describe('client resetPasswordSchema', () => {
  it('accepts password of 6+ characters', () => {
    const result = resetPasswordSchema.safeParse({ password: 'newpassword' });
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 6 characters', () => {
    const result = resetPasswordSchema.safeParse({ password: '12345' });
    expect(result.success).toBe(false);
  });
});
