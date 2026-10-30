import { resolve } from 'node:path';
import cors from 'cors';
import express, { type Express, type Request, type RequestHandler, type Response } from 'express';
import { authServices, createAuthRouter } from './controllers/auth';
import { basketRouter } from './controllers/basket';
import { bookingsRouter } from './controllers/bookings';
import { checkoutRouter } from './controllers/checkout';
import { createDiscountsRouter, discountServices } from './controllers/discounts';
import { createProductsRouter, productPriceServices } from './controllers/products';
import { registrationRouter } from './controllers/registration';
import type { ProductDto } from './dtos/product';
import { authenticateCustomer } from './middleware/authenticateCustomer';
import { requireAdmin } from './middleware/requireAdmin';
import { getProduct, getProducts } from './services/products';

export function createApp(
  fetchProducts: () => Promise<ProductDto[]> = getProducts,
  prices = productPriceServices,
  auth = authServices,
  fetchProduct: (productID: string) => Promise<ProductDto | null> = getProduct,
  authenticate: RequestHandler = authenticateCustomer,
  discounts = discountServices,
  adminOnly: RequestHandler = requireAdmin,
): Express {
  const app = express();

  // Temporary local-development switch: lets GET /discounts be viewed without logging in.
  // Ignored in production and never applies to deletes.
  const adminOrOpenDiscountReads: RequestHandler = (req, res, next) => {
    const openReads =
      process.env.ALLOW_ANONYMOUS_DISCOUNT_READS === 'true' &&
      process.env.NODE_ENV !== 'production';
    if (openReads && req.method === 'GET') {
      next();
      return;
    }
    return adminOnly(req, res, next);
  };

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
  app.use('/discounts', authenticate, createDiscountsRouter(discounts, adminOrOpenDiscountReads));
  return app;
}
