import { CategorySelectionError } from '../errors/categorySelectionError';
import { Prisma } from '../generated/prisma/client';
import type { CreateProduct } from '../schemas/product';
import type { StoredProductImage } from '../services/productImages';

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

export async function createProductRecord(
  input: CreateProduct,
  images: StoredProductImage[] = [],
): Promise<ProductWithRelations> {
  const { prisma } = await import('../prismaClient');

  try {
    return await prisma.product.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        quantity: input.quantity,
        weight: input.weight,
        draft: input.draft ?? true,
        visible: !(input.draft ?? true),
        ...(input.price !== undefined ? { productPrices: { create: { price: input.price } } } : {}),
        productImages: { create: images },
        productCategories: {
          create: (input.categoryIDs ?? []).map((categoryID) => ({
            category: { connect: { categoryID } },
          })),
        },
      },
      include: {
        productImages: true,
        productCategories: { include: { category: { include: { department: true } } } },
      },
    });
  } catch (error) {
    if (
      input.categoryIDs?.length &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2025' || error.code === 'P2003')
    ) {
      throw new CategorySelectionError();
    }
    throw error;
  }
}
