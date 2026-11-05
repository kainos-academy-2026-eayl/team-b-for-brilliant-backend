import { HttpError } from '../errors/httpError';
import type { CheckoutInput } from '../schemas/checkout';
import { findUsableDiscount } from '../services/discountCodes';
import {
  calculateOrderTotals,
  type OrderTotalsDto,
  toPence,
  toTotalsDto,
} from '../services/orderTotals';
import { processPayment } from '../services/payments';
import { lockCustomer } from './customerLock';
import { findReorderItems } from './reorder';

export interface CompletedCheckout extends OrderTotalsDto {
  orderID: string;
}

export async function completeCheckout(
  userID: string,
  input: CheckoutInput,
): Promise<CompletedCheckout> {
  const { prisma } = await import('../prismaClient');
  const reorder = Boolean(input.reorderOrderID);

  return prisma.$transaction(async (transaction) => {
    // A second checkout for this customer waits here, then sees the already-cleared basket
    await lockCustomer(transaction, userID);

    const basketItems = input.reorderOrderID
      ? await findReorderItems(userID, input.reorderOrderID, transaction)
      : await transaction.basket.findMany({
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

    let subtotalPence = 0;
    let boughtCount = 0;

    for (const item of basketItems) {
      const { product } = item;

      if (!product.visible || product.draft || product.deletedAt !== null) {
        if (reorder) continue;
        throw new HttpError(409, `${product.name} is no longer available`);
      }

      const latestPrice = await transaction.productPrices.findFirst({
        where: { productID: item.productID },
        orderBy: [{ createdAt: 'desc' }, { priceID: 'desc' }],
      });

      if (!latestPrice) {
        if (reorder) continue;
        throw new HttpError(409, `${product.name} has no price`);
      }

      // Only takes stock if enough is left; count 0 means someone else bought it first
      const stockUpdate = await transaction.product.updateMany({
        where: { productID: item.productID, quantity: { gte: item.quantity } },
        data: { quantity: { decrement: item.quantity } },
      });

      if (stockUpdate.count === 0) {
        if (reorder) continue;
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

      subtotalPence += toPence(latestPrice.price) * item.quantity;
      boughtCount += 1;
    }

    // A reorder skips unavailable items, but needs at least one left. Throwing rolls back the order.
    if (reorder && boughtCount === 0) {
      throw new HttpError(409, 'None of the items from that order are available');
    }

    // The total is always worked out here, never taken from the browser
    const discount = input.discountCode
      ? await findUsableDiscount(input.discountCode, transaction)
      : null;
    const totals = calculateOrderTotals(subtotalPence, discount);

    // If the card is declined this throws, the whole transaction rolls back and no order exists
    const payment = await processPayment(input.card);

    await transaction.order.update({
      where: { orderID: order.orderID },
      data: {
        discountID: discount?.discountID ?? null,
        deliveryFirstname: input.delivery.firstname,
        deliverySurname: input.delivery.surname,
        deliveryAddressLine1: input.delivery.addressLine1,
        deliveryAddressLine2: input.delivery.addressLine2,
        deliveryPostcode: input.delivery.postcode,
        deliveryCharge: totals.deliveryPence / 100,
        discountAmount: totals.discountPence / 100,
        paymentStatus: payment.status,
        cardLast4: payment.last4,
      },
    });

    // A reorder must leave the customer's basket exactly as it was
    if (!reorder) {
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
    }

    return { orderID: order.orderID, ...toTotalsDto(totals) };
  });
}
