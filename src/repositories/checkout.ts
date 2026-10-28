import { HttpError } from '../errors/httpError';
import { lockCustomer } from './customerLock';

export async function completeCheckout(userID: string): Promise<{ orderID: string }> {
  const { prisma } = await import('../prismaClient');

  return prisma.$transaction(async (transaction) => {
    // A second checkout for this customer waits here, then sees the already-cleared basket
    await lockCustomer(transaction, userID);

    const basketItems = await transaction.basket.findMany({
      where: { userID },
      include: { product: true },
    });

    if (basketItems.length === 0) {
      throw new HttpError(400, 'Your basket is empty');
    }

    const order = await transaction.order.create({
      data: { userID },
      select: { orderID: true },
    });

    for (const item of basketItems) {
      const { product } = item;

      if (!product.visible || product.draft || product.deletedAt !== null) {
        throw new HttpError(409, `${product.name} is no longer available`);
      }

      const latestPrice = await transaction.productPrices.findFirst({
        where: { productID: item.productID },
        orderBy: [{ createdAt: 'desc' }, { priceID: 'desc' }],
      });

      if (!latestPrice) {
        throw new HttpError(409, `${product.name} has no price`);
      }

      // Only takes stock if enough is left; count 0 means someone else bought it first
      const stockUpdate = await transaction.product.updateMany({
        where: { productID: item.productID, quantity: { gte: item.quantity } },
        data: { quantity: { decrement: item.quantity } },
      });

      if (stockUpdate.count === 0) {
        throw new HttpError(409, `Not enough ${product.name} in stock`);
      }

      await transaction.orderItem.create({
        data: {
          orderID: order.orderID,
          productID: item.productID,
          quantity: item.quantity,
          unitPrice: latestPrice.price,
        },
      });
    }

    const soldOut = await transaction.product.findMany({
      where: {
        productID: { in: basketItems.map((item) => item.productID) },
        quantity: 0,
      },
      select: { productID: true },
    });

    await transaction.basket.deleteMany({
      where: {
        OR: [{ userID }, { productID: { in: soldOut.map((product) => product.productID) } }],
      },
    });

    return { orderID: order.orderID };
  });
}
