import * as z from 'zod';

const QuantitySchema = z.int().min(1).max(2_147_483_647);

export const AddBasketItemSchema = z.object({
  productID: z.string().trim().min(1),
  quantity: QuantitySchema,
});

// 0 is allowed when editing: it means "remove this item from the basket"
export const UpdateBasketItemSchema = z.object({
  quantity: z.int().min(0).max(2_147_483_647),
});

export function validateAddBasketItem(input: unknown) {
  const result = AddBasketItemSchema.safeParse(input);

  if (!result.success) {
    return { success: false as const, errors: z.flattenError(result.error) };
  }

  return { success: true as const, data: result.data };
}

export function validateUpdateBasketItem(input: unknown) {
  const result = UpdateBasketItemSchema.safeParse(input);

  if (!result.success) {
    return { success: false as const, errors: z.flattenError(result.error) };
  }

  return { success: true as const, data: result.data };
}
