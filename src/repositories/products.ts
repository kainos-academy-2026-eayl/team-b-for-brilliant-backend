import type { Prisma } from '../generated/prisma/client';

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    productImages: true;
    productCategories: { include: { category: { include: { department: true } } } };
  };
}>;

export interface ProductFilters {
  name?: string;
  categoryID?: string;
}

export async function findProducts(filters: ProductFilters = {}): Promise<ProductWithRelations[]> {
  const { prisma } = await import('../prismaClient');

  return prisma.product.findMany({
    where: {
      ...(filters.name === undefined
        ? {}
        : { name: { contains: filters.name, mode: 'insensitive' as const } }),
      ...(filters.categoryID === undefined
        ? {}
        : { productCategories: { some: { categoryID: filters.categoryID } } }),
    },
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
  return findProducts({ name });
}
