import * as z from 'zod/mini';

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().with(z.regex(/^.+$/, 'Password is required')),
});

export const signupSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().with(z.regex(/^.{6,}$/, 'Password must be at least 6 characters')),
  username: z.string()
    .with(z.regex(/^.{3,}$/, 'Username must be at least 3 characters'))
    .with(z.regex(/^[a-z0-9-]+$/, 'Only letters, numbers, and hyphens allowed')),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().with(z.regex(/^.{6,}$/, 'Password must be at least 6 characters')),
});
