import * as z from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.strictObject({
  email,
  password: z.string().min(8).max(1024),
});
