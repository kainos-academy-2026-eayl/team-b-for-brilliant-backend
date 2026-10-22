import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';
import type { ProductDto } from '../src/dtos/product';

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
      categories: [
        {
          categoryID: 'category-1',
          name: 'Accessories',
          description: 'Product accessories',
          departmentID: 'department-1',
        },
      ],
      departments: [
        {
          departmentID: 'department-1',
          name: 'Lifestyle',
          description: 'Lifestyle products',
        },
      ],
      productImages: [
        {
          imageID: 'image-1',
          productID: 'product-1',
          imageUrl: '/images/product-1.svg',
          imageOrder: 0,
        },
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
      categories: [],
      departments: [],
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

test('GET /products/:productID returns the selected product with images', async () => {
  const product: ProductDto = {
    productID: 'product-1',
    name: 'Example product',
    description: 'Details',
    quantity: 5,
    draft: false,
    visible: true,
    weight: 1.5,
    deletedAt: null,
    categories: [
      {
        categoryID: 'category-1',
        name: 'Accessories',
        description: 'Product accessories',
        departmentID: 'department-1',
      },
    ],
    departments: [
      {
        departmentID: 'department-1',
        name: 'Lifestyle',
        description: 'Lifestyle products',
      },
    ],
    productImages: [
      {
        imageID: 'image-1',
        productID: 'product-1',
        imageUrl: '/images/product-1.svg',
        imageOrder: 0,
      },
    ],
  };
  const app = createApp(
    async () => [],
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
    async () => null,
  );
  const response = await request(app).get('/products/missing').expect(404);
  assert.deepEqual(response.body, { error: 'Product not found' });
});

test('GET /products/:productID propagates database failures', async () => {
  const app = createApp(
    async () => [],
    undefined,
    async () => {
      throw new Error('Database unavailable');
    },
  );
  await request(app).get('/products/product-1').expect(500);
});
