import type { ProductDto } from '../dtos/product';
import { toProductDto } from '../mappers/product';
import { findProducts } from '../repositories/products';

export async function getProducts(
  fetchProducts: typeof findProducts = findProducts,
): Promise<ProductDto[]> {
  const products = await fetchProducts();
  return products.map(toProductDto);
}
