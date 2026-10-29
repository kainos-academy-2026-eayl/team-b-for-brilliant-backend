import { z } from 'zod';

export const accountDetailsSchema = z.strictObject({
  firstname: z.string().trim().max(100).default(''),
  surname: z.string().trim().max(100).default(''),
  addressLine1: z.string().trim().max(255).default(''),
  addressLine2: z.string().trim().max(255).default(''),
  postcode: z.string().trim().max(20).default(''),
});

export type AccountDetails = z.infer<typeof accountDetailsSchema>;
