export async function findAllDiscounts() {
  const { prisma } = await import('../prismaClient');

  return prisma.discounts.findMany({ orderBy: [{ code: 'asc' }, { discountID: 'asc' }] });
}

export async function deleteDiscountByID(discountID: string) {
  const { prisma } = await import('../prismaClient');

  return prisma.discounts.deleteMany({ where: { discountID } });
}
