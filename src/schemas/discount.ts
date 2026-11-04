import * as z from 'zod';

const WHOLE_NUMBER = /^\d{1,3}$/;
// Decimal(10, 2) in the database allows at most 8 integer digits
const POSITIVE_AMOUNT = /^\d{1,8}(\.\d{1,2})?$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) {
    return null;
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export const CreateDiscountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/),
    type: z.enum(['PERCENTAGE', 'AMOUNT_OFF']),
    value: z.string().trim(),
    expiryDate: z.string().trim(),
  })
  .superRefine((input, ctx) => {
    if (input.type === 'PERCENTAGE') {
      if (!WHOLE_NUMBER.test(input.value) || Number(input.value) > 100) {
        ctx.addIssue({
          code: 'custom',
          path: ['value'],
          message: 'Percentage must be a whole number between 0 and 100',
        });
      }
    } else if (!POSITIVE_AMOUNT.test(input.value) || Number(input.value) <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Amount must be a positive number with up to 2 decimal places',
      });
    }

    const expiry = parseDate(input.expiryDate);
    if (!expiry) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiryDate'],
        message: 'Expiry date must be a valid date in the format YYYY-MM-DD',
      });
    } else if (input.expiryDate < new Date().toISOString().slice(0, 10)) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiryDate'],
        message: 'Expiry date cannot be in the past',
      });
    }
  })
  .transform((input) => ({
    code: input.code,
    type: input.type,
    value: input.value,
    expiryDate: new Date(`${input.expiryDate}T00:00:00.000Z`),
  }));

export type CreateDiscountInput = z.output<typeof CreateDiscountSchema>;

export function validateCreateDiscount(input: unknown) {
  const result = CreateDiscountSchema.safeParse(input);

  if (!result.success) {
    return { success: false as const, errors: z.flattenError(result.error) };
  }

  return { success: true as const, data: result.data };
}
