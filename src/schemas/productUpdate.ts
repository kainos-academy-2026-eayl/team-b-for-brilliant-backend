import { z } from 'zod';

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export const productImageUploadSchema = z
  .object({
    contentType: z.enum(['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
    data: z
      .string()
      .min(1)
      .max(Math.ceil(MAX_PRODUCT_IMAGE_BYTES / 3) * 4)
      .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
  })
  .strict();
export type ProductImageUpload = z.infer<typeof productImageUploadSchema>;

export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().max(10000).nullable(),
    quantity: z.int().min(0).max(2_147_483_647),
    weight: z.number().min(0),
    draft: z.boolean(),
    visible: z.boolean(),
    price: z.string().regex(/^\d{1,8}\.\d{2}$/, 'Enter a price between 0.00 and 99999999.99.'),
    categoryIDs: z
      .array(z.string().min(1))
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, 'Choose each category once.'),
    images: z
      .array(z.union([z.object({ imageID: z.string().min(1) }).strict(), productImageUploadSchema]))
      .max(5)
      .refine((images) => {
        const ids = images.flatMap((image) => ('imageID' in image ? [image.imageID] : []));
        return new Set(ids).size === ids.length;
      }, 'Choose each existing image once.')
      .optional(),
  })
  .strict()
  .refine((input) => input.visible !== input.draft, {
    message: 'Choose either visible to customers or draft.',
    path: ['draft'],
  });

export type ProductUpdate = z.infer<typeof productUpdateSchema>;
