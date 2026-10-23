import { resolve } from 'node:path';
import cors from 'cors';
import express, { type Express, type Request, type RequestHandler, type Response } from 'express';
import { authServices, createAuthRouter } from './controllers/auth';
import { basketRouter } from './controllers/basket';
import { bookingsRouter } from './controllers/bookings';
import { checkoutRouter } from './controllers/checkout';
import { createProductsRouter, productPriceServices } from './controllers/products';
import { registrationRouter } from './controllers/registration';
import type { ProductDto } from './dtos/product';
import { authenticateCustomer } from './middleware/authenticateCustomer';
import { getProduct, getProducts } from './services/products';

export function createApp(
  fetchProducts: () => Promise<ProductDto[]> = getProducts,
  prices = productPriceServices,
  auth = authServices,
  fetchProduct: (productID: string) => Promise<ProductDto | null> = getProduct,
  authenticate: RequestHandler = authenticateCustomer,
): Express {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:8000' }));
  app.use('/api/v1/auth', registrationRouter);
  app.use('/images', express.static(resolve('public/images'), { index: false }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/auth', createAuthRouter(auth));
  app.use('/bookings', bookingsRouter);
  app.use('/products', createProductsRouter(fetchProducts, prices, fetchProduct));
  app.use('/basket', authenticate, basketRouter);
  app.use('/checkout', authenticate, checkoutRouter);
  return app;
}
