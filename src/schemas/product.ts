import * as z from 'zod';

export const ProductSearchSchema = z.string().trim().min(1);

export const CreateProductSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  quantity: z.int().min(0).max(2_147_483_647),
  weight: z.number().min(0),
  draft: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export type CreateProduct = z.infer<typeof CreateProductSchema>;

export function validateCreateProduct(input: unknown) {
  const result = CreateProductSchema.safeParse(input);

  if (!result.success) {
    return { success: false as const, errors: z.flattenError(result.error) };
  }

  return { success: true as const, data: result.data };
}
