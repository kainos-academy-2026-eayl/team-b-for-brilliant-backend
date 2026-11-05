import * as z from 'zod';

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/;

// "bt71nt" and "BT7  1NT" are both stored as "BT7 1NT"
function formatPostcode(postcode: string): string {
  const compact = postcode.replace(/\s+/g, '');
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

function isInFuture(expiry: string, now: Date): boolean {
  const [month, year] = expiry.split('/').map(Number);
  if (!month || year === undefined) return false;
  // A card is valid until the end of its expiry month
  return new Date(2000 + year, month, 1) > now;
}

export const QuoteSchema = z.object({
  discountCode: z.string().trim().max(50).optional(),
});

export const ReorderSessionSchema = z.object({
  orderID: z.uuid(),
  discountCode: z.string().trim().max(50).optional(),
});

export const CheckoutSchema = z.object({
  delivery: z.object({
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
  }),
  discountCode: z.string().trim().max(50).optional(),
  reorderOrderID: z.uuid().optional(),
  card: z.object({
    cardNumber: z
      .string()
      .transform((value) => value.replace(/[\s-]/g, ''))
      .pipe(z.string().regex(/^\d{16}$/)),
    expiry: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/)
      .refine((value) => isInFuture(value, new Date())),
    cvv: z
      .string()
      .trim()
      .regex(/^\d{3}$/),
  }),
});

export type CheckoutInput = z.output<typeof CheckoutSchema>;

// Turns zod's errors into { "delivery.postcode": [...], "card.cardNumber": [...] }
// so the frontend knows which field each problem belongs to
function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

export function validateQuote(input: unknown) {
  const result = QuoteSchema.safeParse(input ?? {});
  if (!result.success) {
    return { success: false as const, fieldErrors: toFieldErrors(result.error) };
  }
  return { success: true as const, data: result.data };
}

export function validateCheckout(input: unknown) {
  const result = CheckoutSchema.safeParse(input);
  if (!result.success) {
    return { success: false as const, fieldErrors: toFieldErrors(result.error) };
  }
  return { success: true as const, data: result.data };
}

export function validateReorderSession(input: unknown) {
  const result = ReorderSessionSchema.safeParse(input ?? {});
  if (!result.success) {
    return { success: false as const, fieldErrors: toFieldErrors(result.error) };
  }
  return { success: true as const, data: result.data };
}
