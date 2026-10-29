import type { ProductDto } from '../dtos/product';
import { toProductDto } from '../mappers/product';
import { findProduct, findProducts, findProductsByName } from '../repositories/products';

export async function getProducts(
  fetchProducts: typeof findProducts = findProducts,
): Promise<ProductDto[]> {
  const products = await fetchProducts();
  return products.map(toProductDto);
}

export async function getProduct(
  productID: string,
  fetchProduct: typeof findProduct = findProduct,
): Promise<ProductDto | null> {
  const product = await fetchProduct(productID);
  return product === null ? null : toProductDto(product);
}

export async function getProductsByName(
  name: string,
  fetchProductsByName: typeof findProductsByName = findProductsByName,
): Promise<ProductDto[]> {
  const products = await fetchProductsByName(name);
  return products.map(toProductDto);
}