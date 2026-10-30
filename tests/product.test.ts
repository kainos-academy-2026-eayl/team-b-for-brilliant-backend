import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';
import type { ProductDto } from '../src/dtos/product';

test('GET /products returns products with their images', async () => {
  const products: ProductDto[] = [
    {
      productID: 'product-1',
      name: 'Example product',
      description: null,
      quantity: 5,
      draft: false,
      visible: true,
      weight: 1.5,
      salesNo: 3,
      deletedAt: null,
      productImages: [
        {
          imageID: 'image-1',
          productID: 'product-1',
          imageUrl: '/images/product-1.svg',
          imageOrder: 0,
        },
      ],
      categories: [
        {
          categoryID: 'category-1',
          name: 'Tools',
          description: null,
          departmentID: 'department-1',
        },
      ],
      departments: [{ departmentID: 'department-1', name: 'Garden', description: null }],
    },
    {
      productID: 'product-2',
      name: 'Product without images',
      description: 'No images yet',
      quantity: 0,
      draft: true,
      visible: false,
      weight: 2,
      salesNo: 0,
      deletedAt: null,
      productImages: [],
      categories: [],
      departments: [],
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

test('GET /products/:productID returns the selected product with images', async () => {
  const product: ProductDto = {
    productID: 'product-1',
    name: 'Example product',
    description: 'Details',
    quantity: 5,
    draft: false,
    visible: true,
    weight: 1.5,
    salesNo: 3,
    deletedAt: null,
    productImages: [
      {
        imageID: 'image-1',
        productID: 'product-1',
        imageUrl: '/images/product-1.svg',
        imageOrder: 0,
      },
    ],
    categories: [],
    departments: [],
  };
  const app = createApp(
    async () => [],
    undefined,
    undefined,
    async (id) => {
      assert.equal(id, 'product-1');
      return product;
    },
  );
  const response = await request(app).get('/products/product-1').expect(200);
  assert.deepEqual(response.body, { product });
});

test('GET /products/:productID returns 404 for an unknown product', async () => {
  const app = createApp(
    async () => [],
    undefined,
    undefined,
    async () => null,
  );
  const response = await request(app).get('/products/missing').expect(404);
  assert.deepEqual(response.body, { error: 'Product not found' });
});

test('GET /products/:productID propagates database failures', async () => {
  const app = createApp(
    async () => [],
    undefined,
    undefined,
    async () => {
      throw new Error('Database unavailable');
    },
  );
  await request(app).get('/products/product-1').expect(500);
});
