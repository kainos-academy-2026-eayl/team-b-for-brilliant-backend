import { type Request, type Response, Router } from 'express';
import type { ProductDto, ProductResponseDto, ProductsResponseDto } from '../dtos/product';
import { getCurrentProductPrice, getProductPrices } from '../services/productPrices';
import { getProduct } from '../services/products';

export const productPriceServices = {
  getProductPrices: (productID: string) => getProductPrices(productID),
  getCurrentProductPrice: (productID: string) => getCurrentProductPrice(productID),
};

export function createProductsRouter(
  fetchProducts: () => Promise<ProductDto[]>,
  prices = productPriceServices,
  fetchProduct: (productID: string) => Promise<ProductDto | null> = getProduct,
): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response<ProductsResponseDto>) => {
    const products = await fetchProducts();
    res.json({ products });
  });

  router.get('/:productID', async (req, res: Response<ProductResponseDto | { error: string }>) => {
    const product = await fetchProduct(req.params.productID);
    if (product === null) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product });
  });

  router.get('/:productID/prices', async (req, res) => {
    const result = await prices.getProductPrices(req.params.productID);
    if (result === null) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ prices: result });
  });

  router.get('/:productID/prices/current', async (req, res) => {
    const result = await prices.getCurrentProductPrice(req.params.productID);
    if (result === null) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(result);
  });

  return router;
}
