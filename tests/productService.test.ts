import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toProductDto } from '../src/mappers/product';
import type { ProductWithImages } from '../src/repositories/products';
import { getProducts } from '../src/services/products';

const product: ProductWithImages = {
  productID: 'product-1',
  name: 'Example',
  description: null,
  quantity: 5,
  draft: false,
  visible: true,
  weight: 1.5,
  deletedAt: new Date('2026-10-01T12:00:00.000Z'),
  productImages: [{ imageID: 'image-1', productID: 'product-1', imageUrl: '/image.jpg' }],
};

test('product mapper preserves the response fields and serializes dates', () => {
  const dto = toProductDto(product);
  assert.deepEqual(dto, { ...product, deletedAt: '2026-10-01T12:00:00.000Z' });
  assert.notEqual(dto.productImages, product.productImages);
  assert.notEqual(dto.productImages[0], product.productImages[0]);
  assert.ok(product.deletedAt instanceof Date);
});

test('product mapper handles null dates and products without images', () => {
  const value = { ...product, deletedAt: null, productImages: [] };
  assert.deepEqual(toProductDto(value), value);
});

test('product service fetches from the repository and maps the results', async () => {
  let calls = 0;
  const products = await getProducts(async () => {
    calls += 1;
    return [product];
  });

  assert.equal(calls, 1);
  assert.deepEqual(products, [toProductDto(product)]);
});

test('product service returns an empty list for an empty repository', async () => {
  assert.deepEqual(await getProducts(async () => []), []);
});

test('product service propagates repository errors', async () => {
  const error = new Error('Database unavailable');
  await assert.rejects(
    getProducts(async () => {
      throw error;
    }),
    (actual) => actual === error,
  );
});
