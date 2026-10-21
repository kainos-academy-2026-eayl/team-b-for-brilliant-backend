export async function findProductPrices(productID: string, currentOnly: boolean) {
  const { prisma } = await import('../prismaClient');

  return prisma.product.findUnique({
    where: { productID },
    select: {
      productPrices: {
        orderBy: [{ createdAt: 'desc' }, { priceID: 'desc' }],
        ...(currentOnly ? { take: 1 } : {}),
      },
    },
  });
}
