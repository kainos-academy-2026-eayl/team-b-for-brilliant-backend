import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { findProducts, findProductsByName } from '../src/repositories/products';

test('database search matches partial names without case sensitivity', {
  skip: process.env.RUN_DATABASE_TESTS !== 'true',
}, async (context) => {
  const { prisma } = await import('../src/prismaClient');
  const needle = `search-${randomUUID()}`;
  const productIDs = [randomUUID(), randomUUID(), randomUUID()];
  const departmentID = randomUUID();
  const categoryID = randomUUID();

  context.after(async () => {
    try {
      await prisma.product.deleteMany({ where: { productID: { in: productIDs } } });
      await prisma.category.deleteMany({ where: { categoryID } });
      await prisma.department.deleteMany({ where: { departmentID } });
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

  await prisma.department.create({ data: { departmentID, name: needle } });
  await prisma.category.create({ data: { categoryID, name: needle, departmentID } });
  const firstProductID = productIDs[0];
  assert.ok(firstProductID);
  await prisma.productCategories.create({ data: { productID: firstProductID, categoryID } });
  for (const filters of [{ categoryID }, { categoryID, name: needle.toUpperCase() }]) {
    const filtered = await findProducts(filters);
    assert.deepEqual(
      filtered.map((product) => product.productID),
      [firstProductID],
    );
    assert.equal(filtered[0]?.productCategories[0]?.category.department.departmentID, departmentID);
  }
  assert.deepEqual(await findProducts({ categoryID, name: `${needle}-missing` }), []);
  assert.deepEqual(await findProducts({ categoryID: randomUUID() }), []);
});
