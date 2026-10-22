import type { Prisma } from '../generated/prisma/client';

export type BasketItemWithProduct = Prisma.BasketItemGetPayload<{
  include: { product: true };
}>;

export async function findBasketItems(customerID: string): Promise<BasketItemWithProduct[]> {
  const { prisma } = await import('../prismaClient');

  return prisma.basketItem.findMany({
    where: { customerID },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function findBasketItem(
  customerID: string,
  productID: string,
): Promise<BasketItemWithProduct | null> {
  const { prisma } = await import('../prismaClient');

  return prisma.basketItem.findUnique({
    where: { customerID_productID: { customerID, productID } },
    include: { product: true },
  });
}

export async function findProductForBasket(productID: string) {
  const { prisma } = await import('../prismaClient');

  return prisma.product.findUnique({ where: { productID } });
}

export async function saveBasketItemQuantity(
  customerID: string,
  productID: string,
  quantity: number,
): Promise<BasketItemWithProduct> {
  const { prisma } = await import('../prismaClient');

  return prisma.basketItem.upsert({
    where: { customerID_productID: { customerID, productID } },
    create: { customerID, productID, quantity },
    update: { quantity },
    include: { product: true },
  });
}

export async function deleteBasketItem(customerID: string, productID: string) {
  const { prisma } = await import('../prismaClient');

  return prisma.basketItem.deleteMany({ where: { customerID, productID } });
}
