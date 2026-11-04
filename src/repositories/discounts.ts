import { Prisma } from '../generated/prisma/client';
import type { CreateDiscountInput } from '../schemas/discount';

export async function findAllDiscounts() {
  const { prisma } = await import('../prismaClient');

  return prisma.discounts.findMany({ orderBy: [{ code: 'asc' }, { discountID: 'asc' }] });
}

export async function deleteDiscountByID(discountID: string) {
  const { prisma } = await import('../prismaClient');

  return prisma.discounts.deleteMany({ where: { discountID } });
}

// Returns null when the code already exists (also covers two simultaneous requests)
export async function createDiscountRecord(input: CreateDiscountInput) {
  const { prisma } = await import('../prismaClient');

  try {
    return await prisma.discounts.create({ data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return null;
    }
    throw error;
  }
}
