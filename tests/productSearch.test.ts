import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createProductsRouter } from '../src/controllers/products';
import type { ProductDto } from '../src/dtos/product';

const matchingProduct: ProductDto = {
  productID: 'search-product',
  name: 'Travel Mug',
  description: null,
  quantity: 5,
  draft: false,
  visible: true,
  weight: 1,
  salesNo: 0,
  deletedAt: null,
  productImages: [],
  categories: [],
  departments: [],
};

function createSearchApp(matches: ProductDto[] = [matchingProduct]) {
  const searches: string[] = [];
  let listCalls = 0;
  const app = express();
  app.use(
    '/products',
    createProductsRouter(
      async () => {
        listCalls += 1;
        return [matchingProduct];
      },
      undefined,
      undefined,
      async (name) => {
        searches.push(name);
        return matches;
      },
    ),
  );
  return { app, searches, getListCalls: () => listCalls };
}

test('listing without a search preserves the unfiltered catalogue', async () => {
  const { app, searches, getListCalls } = createSearchApp();
  const response = await request(app).get('/products').expect(200);
  assert.deepEqual(response.body, { products: [matchingProduct] });
  assert.deepEqual(searches, []);
  assert.equal(getListCalls(), 1);
});

for (const parameter of ['search', 'q']) {
  test(`${parameter} forwards trimmed text only to the search service`, async () => {
    const { app, searches, getListCalls } = createSearchApp();
    const response = await request(app)
      .get('/products')
      .query({ [parameter]: '  mug  ' })
      .expect(200);
    assert.deepEqual(response.body, { products: [matchingProduct] });
    assert.deepEqual(searches, ['mug']);
    assert.equal(getListCalls(), 0);
  });
}

for (const query of [
  'search=',
  'search=%20%20',
  'search=mug&search=cup',
  'search[name]=mug',
  'q=',
  'q=%20%20',
  'q=mug&q=cup',
  'q[name]=mug',
  'search=mug&q=cup',
]) {
  test(`invalid search is rejected: ${query}`, async () => {
    const { app, searches, getListCalls } = createSearchApp();
    const response = await request(app).get(`/products?${query}`).expect(400);
    assert.equal(typeof response.body.error, 'string');
    assert.deepEqual(searches, []);
    assert.equal(getListCalls(), 0);
  });
}

for (const path of [
  '/products?search=missing',
  '/products?q=missing',
  '/products/search/missing',
]) {
  test(`no matches returns an empty collection: ${path}`, async () => {
    const { app } = createSearchApp([]);
    const response = await request(app).get(path).expect(200);
    assert.deepEqual(response.body, { products: [] });
  });
}

test('legacy search URL forwards trimmed search text', async () => {
  const { app, searches, getListCalls } = createSearchApp();
  const response = await request(app).get('/products/search/%20mug%20').expect(200);
  assert.deepEqual(response.body, { products: [matchingProduct] });
  assert.deepEqual(searches, ['mug']);
  assert.equal(getListCalls(), 0);
});

test('legacy search URL rejects whitespace-only text', async () => {
  const { app, searches } = createSearchApp();
  await request(app).get('/products/search/%20%20').expect(400);
  assert.deepEqual(searches, []);
});
