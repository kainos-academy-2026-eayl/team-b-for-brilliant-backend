import { Router } from 'express';
import { getCategories } from '../services/categories';

export function createCategoriesRouter(
  fetchCategories: typeof getCategories = getCategories,
): Router {
  const router = Router();
  router.get('/', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ categories: await fetchCategories() });
  });
  return router;
}
