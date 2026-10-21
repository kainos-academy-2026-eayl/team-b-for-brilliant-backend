import type { ProductPriceDto } from '../dtos/productPrice';
import type { ProductPrices } from '../generated/prisma/client';

export function toProductPriceDto(price: ProductPrices): ProductPriceDto {
  return {
    priceID: price.priceID,
    productID: price.productID,
    price: price.price.toFixed(2),
    createdAt: price.createdAt.toISOString(),
  };
}
