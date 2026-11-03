import type { BasketItemDto } from '../dtos/basket';
import type { BasketItemWithProduct } from '../repositories/basket';

export const LOW_STOCK_THRESHOLD = 10;

export function toBasketItemDto(item: BasketItemWithProduct): BasketItemDto {
  const stock = item.product.quantity;
  const price = item.product.productPrices[0]?.price;

  return {
    basketItemID: item.basketID,
    productID: item.productID,
    productName: item.product.name,
    imageUrl: item.product.productImages[0]?.imageUrl ?? null,
    unitPrice: price ? price.toFixed(2) : null,
    lineTotal: price ? price.mul(item.quantity).toFixed(2) : null,
    quantityInBasket: item.quantity,
    stockAvailable: stock,
    isQuantityAvailable: item.quantity <= stock,
    // 0 means sold out, not low stock
    lowStock: stock > 0 && stock <= LOW_STOCK_THRESHOLD,
  };
}
