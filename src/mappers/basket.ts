import type { BasketItemDto } from '../dtos/basket';
import type { BasketItemWithProduct } from '../repositories/basket';

export const LOW_STOCK_THRESHOLD = 10;

export function toBasketItemDto(item: BasketItemWithProduct): BasketItemDto {
  const stock = item.product.quantity;

  return {
    basketItemID: item.basketItemID,
    productID: item.productID,
    productName: item.product.name,
    quantityInBasket: item.quantity,
    stockAvailable: stock,
    isQuantityAvailable: item.quantity <= stock,
    // 0 means sold out, not low stock
    lowStock: stock > 0 && stock <= LOW_STOCK_THRESHOLD,
  };
}
