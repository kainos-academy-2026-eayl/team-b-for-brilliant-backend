import { resolve } from 'node:path';
import express, { type Express, type Request, type RequestHandler, type Response } from 'express';
import { basketRouter } from './controllers/basket';
import { bookingsRouter } from './controllers/bookings';
import { checkoutRouter } from './controllers/checkout';
import { createProductsRouter, productPriceServices } from './controllers/products';
import type { ProductDto } from './dtos/product';
import { authenticateCustomer } from './middleware/authenticateCustomer';
import { getProduct, getProducts } from './services/products';

export function createApp(
  fetchProducts: () => Promise<ProductDto[]> = getProducts,
  prices = productPriceServices,
  fetchProduct: (productID: string) => Promise<ProductDto | null> = getProduct,
  authenticate: RequestHandler = authenticateCustomer,
): Express {
  const app = express();

  app.use(express.json());

  app.use('/images', express.static(resolve('public/images'), { index: false }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/bookings', bookingsRouter);
  app.use('/products', createProductsRouter(fetchProducts, prices, fetchProduct));
  app.use('/basket', authenticate, basketRouter);
  app.use('/checkout', authenticate, checkoutRouter);
  return app;
}
