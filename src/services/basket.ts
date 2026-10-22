import type { BasketDto, BasketItemDto } from '../dtos/basket';
import { HttpError } from '../errors/httpError';
import { toBasketItemDto } from '../mappers/basket';
import {
  deleteBasketItem,
  findBasketItem,
  findBasketItems,
  findProductForBasket,
  saveBasketItemQuantity,
} from '../repositories/basket';

export const basketRepository = {
  findBasketItems,
  findBasketItem,
  findProductForBasket,
  saveBasketItemQuantity,
  deleteBasketItem,
};

export type BasketRepository = typeof basketRepository;

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
  const product = await repo.findProductForBasket(productID);

  if (!product?.visible || product.draft || product.deletedAt !== null) {
    throw new HttpError(404, 'Product not found');
  }

  const existing = await repo.findBasketItem(customerID, productID);
  const newQuantity = (existing?.quantity ?? 0) + quantity;

  if (newQuantity > product.quantity) {
    throw new HttpError(409, `Not enough stock. Only ${product.quantity} available.`);
  }

  const saved = await repo.saveBasketItemQuantity(customerID, productID, newQuantity);
  return toBasketItemDto(saved);
}

export async function setBasketItemQuantity(
  customerID: string,
  productID: string,
  quantity: number,
  repo: BasketRepository = basketRepository,
): Promise<BasketItemDto> {
  const existing = await repo.findBasketItem(customerID, productID);

  if (!existing) {
    throw new HttpError(404, 'Item not in basket');
  }

  if (quantity > existing.product.quantity) {
    throw new HttpError(409, `Not enough stock. Only ${existing.product.quantity} available.`);
  }

  const saved = await repo.saveBasketItemQuantity(customerID, productID, quantity);
  return toBasketItemDto(saved);
}

export async function removeFromBasket(
  customerID: string,
  productID: string,
  repo: BasketRepository = basketRepository,
): Promise<void> {
  const result = await repo.deleteBasketItem(customerID, productID);

  if (result.count === 0) {
    throw new HttpError(404, 'Item not in basket');
  }
}
