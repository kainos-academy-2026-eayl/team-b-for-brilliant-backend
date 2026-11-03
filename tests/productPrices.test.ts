import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';
import { Prisma } from '../src/generated/prisma/client';
import { toProductPriceDto } from '../src/mappers/productPrice';
import { getCurrentProductPrice, getProductPrices } from '../src/services/productPrices';

const latest = {
  priceID: 'price-3',
  productID: 'product-1',
  price: new Prisma.Decimal('22.49'),
  createdAt: new Date('2026-10-03T00:00:00.000Z'),
};
const history = [
  latest,
  { ...latest, priceID: 'price-2', price: new Prisma.Decimal('24.99') },
  { ...latest, priceID: 'price-1', price: new Prisma.Decimal('19.99') },
];

test('price mapper preserves decimal precision and serializes timestamps', () => {
  assert.deepEqual(toProductPriceDto({ ...latest, price: new Prisma.Decimal('10') }), {
    priceID: 'price-3',
    productID: 'product-1',
    price: '10.00',
    createdAt: '2026-10-03T00:00:00.000Z',
  });
});

test('price history service requests all records for the requested product', async () => {
  const result = await getProductPrices('product-1', async (id, currentOnly) => {
    assert.equal(id, 'product-1');
    assert.equal(currentOnly, false);
    return { productPrices: history };
  });
  assert.deepEqual(result, history.map(toProductPriceDto));
});

test('current price service requests only the latest price', async () => {
  const result = await getCurrentProductPrice('product-1', async (id, currentOnly) => {
    assert.equal(id, 'product-1');
    assert.equal(currentOnly, true);
    return { productPrices: [latest] };
  });
  assert.deepEqual(result, { price: toProductPriceDto(latest) });
});

test('price services distinguish missing products from products without prices', async () => {
  assert.equal(await getProductPrices('missing', async () => null), null);
  assert.equal(await getCurrentProductPrice('missing', async () => null), null);
  assert.deepEqual(await getProductPrices('empty', async () => ({ productPrices: [] })), []);
  assert.deepEqual(await getCurrentProductPrice('empty', async () => ({ productPrices: [] })), {
    price: null,
  });
});

test('both price services propagate repository errors', async () => {
  const failure = async () => {
    throw new Error('Database unavailable');
  };
  await assert.rejects(getProductPrices('product-1', failure), /Database unavailable/);
  await assert.rejects(getCurrentProductPrice('product-1', failure), /Database unavailable/);
});

test('price endpoints return the expected response shapes and product ID', async () => {
  const app = createApp(async () => [], {
    getProductPrices: async (id) => {
      assert.equal(id, 'product-1');
      return history.map(toProductPriceDto);
    },
    getCurrentProductPrice: async (id) => {
      assert.equal(id, 'product-1');
      return { price: toProductPriceDto(latest) };
    },
  });
  const all = await request(app).get('/products/product-1/prices').expect(200);
  assert.deepEqual(all.body, { prices: history.map(toProductPriceDto) });
  const current = await request(app).get('/products/product-1/prices/current').expect(200);
  assert.deepEqual(current.body, { price: toProductPriceDto(latest) });
});

test('price endpoints return 404 for unknown products', async () => {
  const app = createApp(async () => [], {
    getProductPrices: async () => null,
    getCurrentProductPrice: async () => null,
  });
  for (const suffix of ['prices', 'prices/current']) {
    const result = await request(app).get(`/products/missing/${suffix}`).expect(404);
    assert.deepEqual(result.body, { error: 'Product not found' });
  }
});

test('price endpoints return empty results for existing products without prices', async () => {
  const app = createApp(async () => [], {
    getProductPrices: async () => [],
    getCurrentProductPrice: async () => ({ price: null }),
  });
  const all = await request(app).get('/products/empty/prices').expect(200);
  assert.deepEqual(all.body, { prices: [] });
  const current = await request(app).get('/products/empty/prices/current').expect(200);
  assert.deepEqual(current.body, { price: null });
});

test('price endpoints return 500 for service errors', async () => {
  const failure = async () => {
    throw new Error('Database unavailable');
  };
  const app = createApp(async () => [], {
    getProductPrices: failure,
    getCurrentProductPrice: failure,
  });
  await request(app).get('/products/product-1/prices').expect(500);
  await request(app).get('/products/product-1/prices/current').expect(500);
});
