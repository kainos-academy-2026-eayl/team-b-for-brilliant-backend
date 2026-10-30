import type { Prisma } from '../generated/prisma/client';

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    productImages: true;
    productCategories: { include: { category: { include: { department: true } } } };
  };
}>;

export async function findProducts(): Promise<ProductWithRelations[]> {
  const { prisma } = await import('../prismaClient');

  return prisma.product.findMany({
    include: {
      productImages: true,
      productCategories: { include: { category: { include: { department: true } } } },
    },
  });
}

export async function findProduct(productID: string): Promise<ProductWithRelations | null> {
  const { prisma } = await import('../prismaClient');

  return prisma.product.findUnique({
    where: { productID },
    include: {
      productImages: true,
      productCategories: { include: { category: { include: { department: true } } } },
    },
  });
}

export async function findProductsByName(name: string): Promise<ProductWithRelations[]> {
  const { prisma } = await import('../prismaClient');

  return prisma.product.findMany({
    where: { name: { contains: name, mode: 'insensitive' } },
    include: {
      productImages: true,
      productCategories: { include: { category: { include: { department: true } } } },
    },
  });
}
