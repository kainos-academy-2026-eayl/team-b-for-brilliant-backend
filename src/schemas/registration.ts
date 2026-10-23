import * as z from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.strictObject({
  email,
  password: z.string().min(8).max(1024),
});

export const verifyEmailSchema = z.strictObject({ token: z.string().min(1).max(200) });
export const resendSchema = z.strictObject({ email });
