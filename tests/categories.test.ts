import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';
import { validateCreateProduct } from '../src/schemas/product';
import { getCategories } from '../src/services/categories';
import { createSession } from '../src/services/sessions';

const category = {
  categoryID: 'category-unused',
  name: 'Existing category',
  description: null,
  departmentID: 'department-1',
  department: { departmentID: 'department-1', name: 'Beauty', description: null },
};

test('category service returns every database category with its department, including unused categories', async () => {
  const categories = await getCategories(async () => [category]);
  assert.deepEqual(categories, [
    {
      categoryID: category.categoryID,
      name: category.name,
      description: null,
      departmentID: 'department-1',
      departmentName: 'Beauty',
    },
  ]);
  await assert.rejects(
    getCategories(async () => {
      throw new Error('Database offline');
    }),
    /Database offline/,
  );
});

test('GET /categories requires a verified admin and returns the complete category list', async () => {
  const choices = await getCategories(async () => [category]);
  const app = createApp(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    async () => choices,
  );
  await request(app).get('/categories').expect(401);
  const customer = createSession('category-customer', Date.now(), 0);
  await request(app).get('/categories').set('Authorization', `Bearer ${customer}`).expect(403);
  const admin = createSession('category-admin', Date.now(), 1);
  const response = await request(app)
    .get('/categories')
    .set('Authorization', `Bearer ${admin}`)
    .expect(200);
  assert.deepEqual(response.body, { categories: choices });
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('product category validation allows many IDs but rejects duplicates, invalid IDs and malformed multipart JSON', () => {
  const categoryIDs = Array.from({ length: 1001 }, (_, index) => `category-${index}`);
  const input = { name: 'Product', quantity: 0, weight: 0, categoryIDs };
  assert.equal(validateCreateProduct(input).success, true);
  assert.equal(
    validateCreateProduct(
      { ...input, quantity: '0', weight: '0', categoryIDs: JSON.stringify(categoryIDs) },
      true,
    ).success,
    true,
  );
  for (const value of [['duplicate', 'duplicate'], [''], [1], 'not-an-array']) {
    assert.equal(validateCreateProduct({ ...input, categoryIDs: value }).success, false);
  }
  assert.equal(
    validateCreateProduct({ ...input, quantity: '0', weight: '0', categoryIDs: 'not JSON' }, true)
      .success,
    false,
  );
});
