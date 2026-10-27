import type { Prisma } from '../generated/prisma/client';
import { lockCustomer } from './customerLock';

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

// Reads and writes that must only run while the customer's lock is held
export function createLockedBasketQueries(db: Prisma.TransactionClient) {
  return {
    findProductForBasket: async (productID: string) =>
      db.product.findUnique({ where: { productID } }),

    findBasketItem: (
      customerID: string,
      productID: string,
    ): Promise<BasketItemWithProduct | null> =>
      db.basketItem.findUnique({
        where: { customerID_productID: { customerID, productID } },
        include: { product: true },
      }),

    saveBasketItemQuantity: (
      customerID: string,
      productID: string,
      quantity: number,
    ): Promise<BasketItemWithProduct> =>
      db.basketItem.upsert({
        where: { customerID_productID: { customerID, productID } },
        create: { customerID, productID, quantity },
        update: { quantity },
        include: { product: true },
      }),

    deleteBasketItem: async (customerID: string, productID: string) =>
      db.basketItem.deleteMany({ where: { customerID, productID } }),
  };
}

export type LockedBasketQueries = ReturnType<typeof createLockedBasketQueries>;

// Runs the whole read-check-write in one transaction holding the same lock checkout uses,
// so a basket change can never interleave with a checkout or with another change.
export async function withCustomerLock<T>(
  customerID: string,
  work: (queries: LockedBasketQueries) => Promise<T>,
): Promise<T> {
  const { prisma } = await import('../prismaClient');

  return prisma.$transaction(async (transaction) => {
    await lockCustomer(transaction, customerID);
    return work(createLockedBasketQueries(transaction));
  });
}
