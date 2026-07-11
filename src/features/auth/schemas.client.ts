import * as z from 'zod/mini';

export const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const signupSchema = z.object({
  email: z.string(),
  password: z.string(),
  username: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.string(),
});

export const resetPasswordSchema = z.object({
  password: z.string(),
});
