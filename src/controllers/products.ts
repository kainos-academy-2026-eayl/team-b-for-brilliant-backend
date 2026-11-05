import { type Request, type Response, Router } from 'express';
import type { ProductDto, ProductResponseDto, ProductsResponseDto } from '../dtos/product';
import { CategorySelectionError } from '../errors/categorySelectionError';
import { HttpError, sendErrorResponse } from '../errors/httpError';
import { parseProductUpload } from '../middleware/productUpload';
import { ProductSearchSchema, validateCreateProduct } from '../schemas/product';
import { getCurrentProductPrice, getProductPrices } from '../services/productPrices';
import { createProduct, getProduct, getProductsByName } from '../services/products';

export const productPriceServices = {
  getProductPrices: (productID: string) => getProductPrices(productID),
  getCurrentProductPrice: (productID: string) => getCurrentProductPrice(productID),
};

export function createProductsRouter(
  fetchProducts: () => Promise<ProductDto[]>,
  prices = productPriceServices,
  fetchProduct: (productID: string) => Promise<ProductDto | null> = getProduct,
  searchProducts: (name: string) => Promise<ProductDto[]> = getProductsByName,
  saveProduct: typeof createProduct = createProduct,
): Router {
  const router = Router();

  router.post('/', parseProductUpload, async (req, res) => {
    const input = validateCreateProduct(req.body, Boolean(req.is('multipart/form-data')));
    if (!input.success) {
      res.status(400).json({ error: 'Invalid product', details: input.errors });
      return;
    }

    try {
      const product = await saveProduct(input.data, Array.isArray(req.files) ? req.files : []);
      res
        .status(201)
        .location(`/products/${encodeURIComponent(product.productID)}`)
        .json({ product });
    } catch (error) {
      if (error instanceof HttpError && error.status === 400) {
        const field = error instanceof CategorySelectionError ? 'categoryIDs' : 'images';
        res
          .status(400)
          .json({ error: error.message, details: { fieldErrors: { [field]: [error.message] } } });
        return;
      }
      sendErrorResponse(error, res);
    }
  });

  router.get('/', async (req: Request, res: Response<ProductsResponseDto | { error: string }>) => {
    // Express's simple query parser leaves bracketed parameters as literal keys.
    if (Object.keys(req.query).some((key) => key.startsWith('search[') || key.startsWith('q['))) {
      res.status(400).json({ error: 'Search must be a single non-empty string' });
      return;
    }
    const { search, q: query } = req.query;
    if (search !== undefined && query !== undefined) {
      res.status(400).json({ error: 'Supply either search or q, not both' });
      return;
    }

    const input = search ?? query;
    if (input === undefined) {
      const products = await fetchProducts();
      res.json({ products });
      return;
    }

    const parsed = ProductSearchSchema.safeParse(input);
    if (!parsed.success) {
      res.status(400).json({ error: 'Search must be a single non-empty string' });
      return;
    }
    const products = await searchProducts(parsed.data);
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

  router.get('/search/:name', async (req, res) => {
    const parsed = ProductSearchSchema.safeParse(req.params.name);
    if (!parsed.success) {
      res.status(400).json({ error: 'Search must be a single non-empty string' });
      return;
    }
    const result = await searchProducts(parsed.data);
    res.json({ products: result });
  });
  return router;
}
