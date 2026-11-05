import express, { Router } from 'express';
import { sendErrorResponse } from '../errors/httpError';
import { listProductClassifications } from '../repositories/productEditor';
import { productUpdateSchema } from '../schemas/productUpdate';
import { updateProduct } from '../services/productEditor';
import { getCurrentProductPrice } from '../services/productPrices';
import { getProduct, getProducts, getProductsByName } from '../services/products';

export const productEditorServices = {
  getProduct,
  getCurrentProductPrice,
  listProductClassifications,
  updateProduct,
  getProducts,
  getProductsByName,
};

export function createProductEditorRouter(services = productEditorServices) {
  const router = Router();
  router.use(express.json({ limit: '8mb' }));
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/', async (req, res) => {
    if (
      (req.query.q !== undefined && typeof req.query.q !== 'string') ||
      (req.query.category !== undefined && typeof req.query.category !== 'string')
    ) {
      res.status(400).json({ error: 'Choose a single search and category.' });
      return;
    }
    try {
      const query = (req.query.q ?? '').trim();
      const category = (req.query.category ?? '').trim();
      const products = query
        ? await services.getProductsByName(query)
        : await services.getProducts();
      res.json({
        products: products.filter(
          (product) =>
            product.deletedAt === null &&
            (!category || product.categories.some((item) => item.categoryID === category)),
        ),
      });
    } catch (error) {
      sendErrorResponse(error, res);
    }
  });
  router.get('/:productID', async (req, res) => {
    try {
      const product = await services.getProduct(req.params.productID);
      if (!product || product.deletedAt !== null) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      const [price, classifications] = await Promise.all([
        services.getCurrentProductPrice(req.params.productID),
        services.listProductClassifications(),
      ]);
      res.json({ product, currentPrice: price?.price?.price ?? null, ...classifications });
    } catch (error) {
      sendErrorResponse(error, res);
    }
  });
  router.put('/:productID', async (req, res) => {
    const parsed = productUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid product details', details: parsed.error.flatten() });
      return;
    }
    try {
      res.json(await services.updateProduct(req.params.productID, parsed.data));
    } catch (error) {
      sendErrorResponse(error, res);
    }
  });
  return router;
}
