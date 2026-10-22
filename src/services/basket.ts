import type { BasketDto, BasketItemDto } from '../dtos/basket';
import { HttpError } from '../errors/httpError';
import { toBasketItemDto } from '../mappers/basket';
import {
  findBasketItems,
  type LockedBasketQueries,
  withCustomerLock,
} from '../repositories/basket';

export const basketRepository = {
  findBasketItems,
  withCustomerLock,
};

export type BasketRepository = {
  findBasketItems: typeof findBasketItems;
  withCustomerLock: <T>(
    customerID: string,
    work: (queries: LockedBasketQueries) => Promise<T>,
  ) => Promise<T>;
};

export async function getBasket(
  customerID: string,
  repo: BasketRepository = basketRepository,
): Promise<BasketDto> {
  const items = await repo.findBasketItems(customerID);
  return { items: items.map(toBasketItemDto) };
}

export async function addToBasket(
  customerID: string,
  productID: string,
  quantity: number,
  repo: BasketRepository = basketRepository,
): Promise<BasketItemDto> {
  return repo.withCustomerLock(customerID, async (queries) => {
    const product = await queries.findProductForBasket(productID);

    if (!product?.visible || product.draft || product.deletedAt !== null) {
      throw new HttpError(404, 'Product not found');
    }

    const existing = await queries.findBasketItem(customerID, productID);
    const newQuantity = (existing?.quantity ?? 0) + quantity;

    if (newQuantity > product.quantity) {
      throw new HttpError(409, `Not enough stock. Only ${product.quantity} available.`);
    }

    const saved = await queries.saveBasketItemQuantity(customerID, productID, newQuantity);
    return toBasketItemDto(saved);
  });
}

export async function setBasketItemQuantity(
  customerID: string,
  productID: string,
  quantity: number,
  repo: BasketRepository = basketRepository,
): Promise<BasketItemDto | null> {
  return repo.withCustomerLock(customerID, async (queries) => {
    const existing = await queries.findBasketItem(customerID, productID);

    if (!existing) {
      throw new HttpError(404, 'Item not in basket');
    }

    if (quantity === 0) {
      await queries.deleteBasketItem(customerID, productID);
      return null;
    }

    if (quantity > existing.product.quantity) {
      throw new HttpError(409, `Not enough stock. Only ${existing.product.quantity} available.`);
    }

    const saved = await queries.saveBasketItemQuantity(customerID, productID, quantity);
    return toBasketItemDto(saved);
  });
}

export async function removeFromBasket(
  customerID: string,
  productID: string,
  repo: BasketRepository = basketRepository,
): Promise<void> {
  const result = await repo.withCustomerLock(customerID, (queries) =>
    queries.deleteBasketItem(customerID, productID),
  );

  if (result.count === 0) {
    throw new HttpError(404, 'Item not in basket');
  }
}
