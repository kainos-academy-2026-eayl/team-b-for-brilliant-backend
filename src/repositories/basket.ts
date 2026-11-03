import type { Prisma } from '../generated/prisma/client';
import { lockCustomer } from './customerLock';

const basketProductInclude = {
  productImages: { orderBy: { imageOrder: 'asc' }, take: 1 },
  productPrices: { orderBy: [{ createdAt: 'desc' }, { priceID: 'desc' }], take: 1 },
} satisfies Prisma.ProductInclude;

export type BasketItemWithProduct = Prisma.BasketGetPayload<{
  include: { product: { include: typeof basketProductInclude } };
}>;

export async function findBasketItems(userID: string): Promise<BasketItemWithProduct[]> {
  const { prisma } = await import('../prismaClient');

  return prisma.basket.findMany({
    where: { userID },
    include: { product: { include: basketProductInclude } },
    orderBy: { createdAt: 'asc' },
  });
}

// Reads and writes that must only run while the customer's lock is held
export function createLockedBasketQueries(db: Prisma.TransactionClient) {
  return {
    findBasketItems: (userID: string): Promise<BasketItemWithProduct[]> =>
      db.basket.findMany({
        where: { userID },
        include: { product: { include: basketProductInclude } },
        orderBy: { createdAt: 'asc' },
      }),

    findProductForBasket: async (productID: string) =>
      db.product.findUnique({ where: { productID } }),

    findBasketItem: (userID: string, productID: string): Promise<BasketItemWithProduct | null> =>
      db.basket.findUnique({
        where: { userID_productID: { userID, productID } },
        include: { product: { include: basketProductInclude } },
      }),

    saveBasketItemQuantity: (
      userID: string,
      productID: string,
      quantity: number,
    ): Promise<BasketItemWithProduct> =>
      db.basket.upsert({
        where: { userID_productID: { userID, productID } },
        create: { userID, productID, quantity },
        update: { quantity },
        include: { product: { include: basketProductInclude } },
      }),

    deleteBasketItem: async (userID: string, productID: string) =>
      db.basket.deleteMany({ where: { userID, productID } }),
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
