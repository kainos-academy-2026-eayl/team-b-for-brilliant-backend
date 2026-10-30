import * as z from 'zod';

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/;

// "bt71nt" and "BT7  1NT" are both stored as "BT7 1NT"
function formatPostcode(postcode: string): string {
  const compact = postcode.replace(/\s+/g, '');
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export const UpdateProfileSchema = z.object({
  firstname: z.string().trim().min(1).max(50),
  surname: z.string().trim().min(1).max(50),
  addressLine1: z.string().trim().min(1).max(100),
  addressLine2: z
    .string()
    .trim()
    .max(100)
    .nullish()
    .transform((value) => value || null),
  postcode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(UK_POSTCODE)
    .transform((value) => formatPostcode(value)),
});

export type UpdateProfileInput = z.output<typeof UpdateProfileSchema>;

export function validateUpdateProfile(input: unknown) {
  const result = UpdateProfileSchema.safeParse(input);

  if (!result.success) {
    return { success: false as const, errors: z.flattenError(result.error) };
  }

  return { success: true as const, data: result.data };
}
