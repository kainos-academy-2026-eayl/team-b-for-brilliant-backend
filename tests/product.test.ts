import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';

test('GET /products returns products with their images', async () => {
  const products = [
    {
      productID: 'product-1',
      name: 'Example product',
      description: null,
      quantity: 5,
      draft: false,
      visible: true,
      weight: 1.5,
      deletedAt: null,
      productImages: [
        { imageID: 'image-1', productID: 'product-1', imageUrl: '/images/product-1.svg' },
      ],
    },
    {
      productID: 'product-2',
      name: 'Product without images',
      description: 'No images yet',
      quantity: 0,
      draft: true,
      visible: false,
      weight: 2,
      deletedAt: null,
      productImages: [],
    },
  ];

  const response = await request(createApp(async () => products))
    .get('/products')
    .expect('Content-Type', /json/)
    .expect(200);

  assert.deepEqual(response.body, { products });
});

test('GET /products returns an empty list when there are no products', async () => {
  const response = await request(createApp(async () => []))
    .get('/products')
    .expect(200);

  assert.deepEqual(response.body, { products: [] });
});

test('GET /products reports database failures as server errors', async () => {
  const app = createApp(async () => {
    throw new Error('Database unavailable');
  });

  await request(app).get('/products').expect(500);
});
