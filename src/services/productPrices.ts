import { toProductPriceDto } from '../mappers/productPrice';
import { findProductPrices } from '../repositories/productPrices';

export async function getProductPrices(
  productID: string,
  fetchPrices: typeof findProductPrices = findProductPrices,
) {
  const product = await fetchPrices(productID, false);
  return product ? product.productPrices.map(toProductPriceDto) : null;
}

export async function getCurrentProductPrice(
  productID: string,
  fetchPrices: typeof findProductPrices = findProductPrices,
) {
  const product = await fetchPrices(productID, true);
  if (!product) {
    return null;
  }
  const price = product.productPrices[0];
  return { price: price ? toProductPriceDto(price) : null };
}
