import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { findProductsByName } from '../src/repositories/products';

test('database search matches partial names without case sensitivity', {
  skip: process.env.RUN_DATABASE_TESTS !== 'true',
}, async (context) => {
  const { prisma } = await import('../src/prismaClient');
  const needle = `search-${randomUUID()}`;
  const productIDs = [randomUUID(), randomUUID(), randomUUID()];

  context.after(async () => {
    try {
      await prisma.product.deleteMany({ where: { productID: { in: productIDs } } });
    } finally {
      await prisma.$disconnect();
    }
  });

  await prisma.product.createMany({
    data: productIDs.map((productID, index) => ({
      productID,
      name: index === 2 ? `Unrelated ${productID}` : `Travel ${needle} Mug ${index}`,
      quantity: 5,
      weight: 1,
    })),
  });

  const matches = await findProductsByName(needle.toUpperCase());
  assert.deepEqual(
    matches.map((product) => product.productID).sort(),
    productIDs.slice(0, 2).sort(),
  );
  for (const product of matches) {
    assert.deepEqual(product.productImages, []);
    assert.deepEqual(product.productCategories, []);
  }
  assert.deepEqual(await findProductsByName(`${needle}-missing`), []);
});
