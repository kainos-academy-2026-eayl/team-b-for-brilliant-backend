import { resolve } from 'node:path';
import express, { type Express, type Request, type Response } from 'express';
import { bookingsRouter } from './controllers/bookings';
import { authRouter } from './controllers/login';
import { createProductsRouter, productPriceServices } from './controllers/products';
import type { ProductDto } from './dtos/product';
import { getProducts } from './services/products';
export function createApp(
  fetchProducts: () => Promise<ProductDto[]> = getProducts,
  prices = productPriceServices,
): Express {
  const app = express();

  app.use('/images', express.static(resolve('public/images'), { index: false }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use(express.json());
  app.use('/auth', authRouter);

  app.use('/bookings', bookingsRouter);
  app.use('/products', createProductsRouter(fetchProducts, prices));
  return app;
}
