import { Prisma } from '../generated/prisma/client';
import type { CreateDiscountInput } from '../schemas/discount';

export async function findAllDiscounts() {
  const { prisma } = await import('../prismaClient');

  return prisma.discounts.findMany({ orderBy: [{ code: 'asc' }, { discountID: 'asc' }] });
}

// Returns null when the discount does not exist
export async function updateDiscountExpiry(discountID: string, expiryDate: Date) {
  const { prisma } = await import('../prismaClient');

  try {
    return await prisma.discounts.update({ where: { discountID }, data: { expiryDate } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    throw error;
  }
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
