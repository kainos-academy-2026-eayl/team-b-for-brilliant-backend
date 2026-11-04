import { HttpError } from '../errors/httpError';
import { findBasketItems } from '../repositories/basket';
import { findUsableDiscount, type UsableDiscount } from './discountCodes';
import { calculateOrderTotals, type OrderTotalsDto, toPence, toTotalsDto } from './orderTotals';

interface QuoteBasketItem {
  quantity: number;
  product: {
    name: string;
    quantity: number;
    visible: boolean;
    draft: boolean;
    deletedAt: Date | null;
    productPrices: { price: { toString(): string } }[];
  };
}

export interface QuoteDependencies {
  findBasketItems: (customerID: string) => Promise<QuoteBasketItem[]>;
  findDiscount: (code: string) => Promise<UsableDiscount>;
}

const defaultDependencies: QuoteDependencies = {
  findBasketItems,
  findDiscount: (code) => findUsableDiscount(code),
};

// Works out what the customer would pay right now. Nothing is saved.
export async function getQuote(
  customerID: string,
  discountCode: string | undefined,
  dependencies: QuoteDependencies = defaultDependencies,
): Promise<OrderTotalsDto> {
  const items = await dependencies.findBasketItems(customerID);

  if (items.length === 0) {
    throw new HttpError(400, 'Your basket is empty');
  }

  let subtotalPence = 0;

  for (const item of items) {
    const { product } = item;

    if (!product.visible || product.draft || product.deletedAt !== null) {
      throw new HttpError(409, `${product.name} is no longer available`);
    }

    const price = product.productPrices[0]?.price;
    if (!price) {
      throw new HttpError(409, `${product.name} has no price`);
    }

    if (item.quantity > product.quantity) {
      throw new HttpError(409, `Not enough ${product.name} in stock`);
    }

    subtotalPence += toPence(price) * item.quantity;
  }

  const discount = discountCode ? await dependencies.findDiscount(discountCode) : null;

  return toTotalsDto(calculateOrderTotals(subtotalPence, discount));
}
