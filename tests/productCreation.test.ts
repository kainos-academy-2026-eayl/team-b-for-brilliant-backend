import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';
import type { ProductDto } from '../src/dtos/product';
import { createProduct } from '../src/services/products';
import { createSession } from '../src/services/sessions';
import { validateCreateProduct } from '../src/schemas/product';

const input = { name: 'New product', quantity: 0, weight: 1.5 };
const product: ProductDto = {
  ...input,
  productID: 'new-product',
  description: null,
  draft: true,
  visible: false,
  salesNo: 0,
  deletedAt: null,
  productImages: [],
  categories: [],
  departments: [],
};

function app(saveProduct: typeof createProduct) {
  return createApp(undefined, undefined, undefined, undefined, undefined, undefined, undefined, saveProduct);
}

test('POST /products requires an admin before validating or writing', async () => {
  let calls = 0;
  const service: typeof createProduct = async () => {
    calls += 1;
    return product;
  };
  await request(app(service)).post('/products').send(input).expect(401);
  const customer = createSession('customer-create', Date.now(), 0);
  await request(app(service)).post('/products')
    .set('Authorization', `Bearer ${customer}`).send(input).expect(403);
  assert.equal(calls, 0);
});

test('POST /products validates input, strips generated fields and returns the saved product', async () => {
  const token = createSession('admin-create', Date.now(), 1);
  const response = await request(app(async (data) => {
    assert.deepEqual(data, input);
    return product;
  })).post('/products').set('Authorization', `Bearer ${token}`)
    .send({ ...input, name: '  New product  ', productID: 'forged', salesNo: 999, visible: true }).expect(201);
  assert.deepEqual(response.body, { product });
  assert.equal(response.headers.location, '/products/new-product');
});

test('POST /products rejects malformed fields without writing', async () => {
  const token = createSession('admin-invalid', Date.now(), 1);
  for (const fields of [
    { name: '' }, { name: [] }, { quantity: -1 }, { quantity: 1.1 },
    { quantity: 2_147_483_648 }, { quantity: '2' }, { weight: -1 },
    { weight: '1' }, { draft: 1 }, { description: 5 },
  ]) {
    const response = await request(app(async () => assert.fail('Must not save invalid input')))
      .post('/products').set('Authorization', `Bearer ${token}`)
      .send({ ...input, ...fields }).expect(400);
    assert.equal(response.body.error, 'Invalid product');
    assert.ok(Object.keys(response.body.details.fieldErrors).length > 0);
  }
});

test('POST /products reports persistence failures rather than creation', async () => {
  const token = createSession('admin-error', Date.now(), 1);
  await request(app(async () => { throw new Error('Database unavailable'); }))
    .post('/products').set('Authorization', `Bearer ${token}`).send(input).expect(500);
});

test('createProduct maps the persisted record and propagates database failures', async () => {
  const result = await createProduct(input, [], async (data) => {
    assert.deepEqual(data, input);
    const { categories: _categories, departments: _departments, ...record } = product;
    return { ...record, deletedAt: null, productCategories: [] };
  });
  assert.deepEqual(result, product);
  await assert.rejects(createProduct(input, [], async () => {
    throw new Error('Database unavailable');
  }), /Database unavailable/);
});

test('product creation validation rejects nonfinite weights and accepts boundary values', () => {
  for (const weight of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.equal(validateCreateProduct({ ...input, weight }).success, false);
  }
  assert.equal(validateCreateProduct({ ...input, quantity: 2_147_483_647, weight: 0 }).success, true);
});
