import * as z from 'zod';

export const ProductSearchSchema = z.string().trim().min(1);

export const CreateProductSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  quantity: z.int().min(0).max(2_147_483_647),
  weight: z.number().min(0),
  draft: z.boolean().optional(),
  price: z.string().trim().regex(/^\d{1,8}(?:\.\d{1,2})?$/).optional(),
});

const MultipartProductSchema = CreateProductSchema.extend({
  description: z.string().trim().transform((value) => value || null).optional(),
  quantity: z.string().regex(/^\d+$/).transform(Number).pipe(CreateProductSchema.shape.quantity),
  weight: z.string().regex(/^\d+(?:\.\d+)?$/).transform(Number).pipe(CreateProductSchema.shape.weight),
  draft: z.enum(['true', 'false']).optional().transform((value) => value === undefined ? undefined : value === 'true'),
});

export type CreateProduct = z.infer<typeof CreateProductSchema>;

export function validateCreateProduct(input: unknown, multipart = false) {
  const result = (multipart ? MultipartProductSchema : CreateProductSchema).safeParse(input);

  if (!result.success) {
    return { success: false as const, errors: z.flattenError(result.error) };
  }

  return { success: true as const, data: result.data };
}
