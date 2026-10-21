import type { Prisma } from '../generated/prisma/client';

export type ProductWithImages = Prisma.ProductGetPayload<{
  include: { productImages: true };
}>;

export async function findProducts(): Promise<ProductWithImages[]> {
  const { prisma } = await import('../prismaClient');

  return prisma.product.findMany({
    include: { productImages: true },
  });
}
