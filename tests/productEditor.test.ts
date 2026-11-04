import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createProductEditorRouter, productEditorServices } from '../src/controllers/productEditor';
import { createAuthenticateCustomer } from '../src/middleware/authenticateCustomer';
import { requireAdmin } from '../src/middleware/requireAdmin';
import { saveProductUpdate } from '../src/repositories/productEditor';
import { MAX_PRODUCT_IMAGE_BYTES, productUpdateSchema } from '../src/schemas/productUpdate';
import { decodeProductImages, updateProduct } from '../src/services/productEditor';
import { getCurrentProductPrice } from '../src/services/productPrices';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lL8AAAAASUVORK5CYII=',
  'base64',
);
const input = {
  name: 'Updated',
  description: 'New description',
  price: '12.50',
  quantity: 4,
  weight: 2,
  visible: true,
  draft: false,
  categoryIDs: ['c1'],
  images: [{ contentType: 'image/png' as const, data: png.toString('base64') }],
};
const product = {
  productID: 'p1',
  salesNo: 0,
  name: 'Original',
  description: null,
  quantity: 1,
  weight: 1,
  visible: false,
  draft: true,
  deletedAt: null,
  categories: [],
  departments: [],
  productImages: [],
};

function app() {
  const application = express();
  const saved: unknown[] = [];
  application.use(
    '/admin/products',
    createAuthenticateCustomer((token) =>
      token === 'admin'
        ? { customerID: 'admin-id', accessLevel: 1 }
        : token === 'customer'
          ? { customerID: 'customer-id', accessLevel: 0 }
          : null,
    ),
    requireAdmin,
    createProductEditorRouter({
      ...productEditorServices,
      getProduct: async () => product,
      getProducts: async () => [product],
      getProductsByName: async () => [product],
      getCurrentProductPrice: async () => ({ price: null }),
      listProductClassifications: async () => ({
        categories: [{ categoryID: 'c1', departmentID: 'd1', name: 'Tools', description: null }],
        departments: [{ departmentID: 'd1', name: 'Garden', description: null }],
      }),
      updateProduct: async (id, data) => {
        saved.push({ id, data });
        return { product, currentPrice: data.price };
      },
    }),
  );
  return { application, saved };
}

test('admin editor rejects anonymous/customer reads and writes', async () => {
  const { application, saved } = app();
  await request(application).get('/admin/products/p1').expect(401);
  await request(application).put('/admin/products/p1').send(input).expect(401);
  await request(application)
    .get('/admin/products/p1')
    .set('Authorization', 'Bearer customer')
    .expect(403);
  await request(application)
    .put('/admin/products/p1')
    .set('Authorization', 'Bearer customer')
    .send(input)
    .expect(403);
  assert.equal(saved.length, 0);
});

test('admin reads include hidden drafts and all classifications; valid PUT saves once', async () => {
  const { application, saved } = app();
  const catalog = await request(application)
    .get('/admin/products')
    .set('Authorization', 'Bearer admin')
    .expect(200);
  assert.equal(catalog.body.products[0].draft, true);
  const loaded = await request(application)
    .get('/admin/products/p1')
    .set('Authorization', 'Bearer admin')
    .expect(200);
  assert.equal(loaded.body.product.visible, false);
  assert.equal(loaded.body.categories[0].categoryID, 'c1');
  assert.equal(loaded.headers['cache-control'], 'no-store');
  await request(application)
    .put('/admin/products/p1')
    .set('Authorization', 'Bearer admin')
    .send(input)
    .expect(200);
  assert.deepEqual(saved, [{ id: 'p1', data: input }]);
});

test('invalid fields, duplicate categories, extra fields and unsupported uploads are rejected', async () => {
  const { application, saved } = app();
  for (const invalid of [
    { quantity: -1 },
    { visible: true, draft: true },
    { visible: false, draft: false },
    { quantity: 1.5 },
    { quantity: 2147483648 },
    { price: '1.234' },
    { price: '100000000.00' },
    { name: '' },
    { categoryIDs: ['c1', 'c1'] },
    { salesNo: 99 },
    { images: [{ contentType: 'image/svg+xml', data: 'eA==' }] },
    { images: [{ contentType: 'image/png', data: 'not base64' }] },
    { images: [{ imageID: 'i1' }, { imageID: 'i1' }] },
    { images: [{ imageID: 'i1', imageUrl: '/images/forged.png' }] },
    { images: Array.from({ length: 6 }, (_, index) => ({ imageID: `i${index}` })) },
  ]) {
    await request(application)
      .put('/admin/products/p1')
      .set('Authorization', 'Bearer admin')
      .send({ ...input, ...invalid })
      .expect(400);
  }
  assert.equal(saved.length, 0);
});

test('publication requires exactly one of visible to customers or draft', () => {
  for (const visible of [true, false]) {
    for (const draft of [true, false]) {
      const parsed = productUpdateSchema.safeParse({ ...input, visible, draft });
      assert.equal(parsed.success, visible !== draft);
      if (!parsed.success) {
        assert.ok(
          parsed.error.issues.some(
            (issue) =>
              issue.path[0] === 'draft' &&
              issue.message === 'Choose either visible to customers or draft.',
          ),
        );
      }
    }
  }
});

test('image decoding validates signatures and the exact combined 5 MB limit', () => {
  const atLimit = Buffer.alloc(MAX_PRODUCT_IMAGE_BYTES);
  png.copy(atLimit, 0, 0, 8);
  assert.equal(
    decodeProductImages([{ contentType: 'image/png', data: atLimit.toString('base64') }])[0]?.body
      .length,
    MAX_PRODUCT_IMAGE_BYTES,
  );
  assert.throws(
    () =>
      decodeProductImages([
        { contentType: 'image/png', data: atLimit.toString('base64') },
        { contentType: 'image/png', data: png.toString('base64') },
      ]),
    /5 MB/,
  );
  assert.throws(
    () =>
      decodeProductImages([
        { contentType: 'image/png', data: Buffer.from('<script>').toString('base64') },
      ]),
    /valid PNG/,
  );
});

test('image selections accept mixed ordered references, empty lists and omitted changes', () => {
  const images = [{ imageID: 'i2' }, input.images[0], { imageID: 'i1' }];
  assert.deepEqual(productUpdateSchema.parse({ ...input, images }).images, images);
  assert.deepEqual(productUpdateSchema.parse({ ...input, images: [] }).images, []);
  assert.equal(productUpdateSchema.parse({ ...input, images: undefined }).images, undefined);
});

test('failed database saves remove new uploads; successful uploads retain exact bytes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'product-editor-test-'));
  try {
    await assert.rejects(
      updateProduct(
        'p1',
        input,
        async () => {
          throw new Error('Database unavailable');
        },
        directory,
      ),
      /Database unavailable/,
    );
    assert.deepEqual(await readdir(directory), []);
    let urls: string[] | undefined;
    await updateProduct(
      'p1',
      input,
      async (_id, _input, imageUrls) => {
        urls = imageUrls;
        return { product, currentPrice: '12.50' };
      },
      directory,
    );
    assert.match(urls?.[0] ?? '', /^\/images\/upload-[\w-]+\.png$/);
    const files = await readdir(directory);
    assert.equal(files.length, 1);
    const fileName = files[0];
    assert.ok(fileName);
    assert.deepEqual(await readFile(join(directory, fileName)), png);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('database updates persist all details and relations atomically, preserve price history and roll back invalid categories', {
  skip: process.env.RUN_DATABASE_TESTS !== 'true',
}, async () => {
  const { prisma } = await import('../src/prismaClient');
  const productID = randomUUID();
  const departmentID = randomUUID();
  const categoryID = randomUUID();
  try {
    await prisma.department.create({ data: { departmentID, name: 'Editor test department' } });
    await prisma.category.create({
      data: { categoryID, departmentID, name: 'Editor test category' },
    });

    await prisma.product.create({ data: { productID, name: 'Before', quantity: 1, weight: 1 } });
    const parsed = productUpdateSchema.parse({ ...input, categoryIDs: [categoryID] });
    await saveProductUpdate(productID, parsed, ['/images/upload-test.png']);
    const persisted = await prisma.product.findUniqueOrThrow({
      where: { productID },
      include: { productPrices: true, productCategories: true, productImages: true },
    });
    assert.equal(persisted.name, input.name);
    assert.equal(persisted.description, input.description);
    assert.equal(persisted.quantity, 4);
    assert.equal(persisted.weight, 2);
    assert.equal(persisted.visible, true);
    assert.equal(persisted.draft, false);
    assert.equal(persisted.productCategories[0]?.categoryID, categoryID);
    assert.equal(persisted.productPrices[0]?.price.toFixed(2), '12.50');
    assert.equal(persisted.productImages[0]?.imageUrl, '/images/upload-test.png');
    await saveProductUpdate(productID, { ...parsed, images: undefined });
    assert.equal(await prisma.productPrices.count({ where: { productID } }), 1);
    await saveProductUpdate(productID, {
      ...parsed,
      images: undefined,
      price: '0.00',
      visible: false,
      draft: true,
    });
    assert.equal(await prisma.productPrices.count({ where: { productID } }), 2);
    assert.equal((await getCurrentProductPrice(productID))?.price?.price, '0.00');
    await assert.rejects(
      saveProductUpdate(productID, {
        ...parsed,
        name: 'Must roll back',
        categoryIDs: ['missing-category'],
      }),
      /category is no longer available/,
    );
    const afterFailure = await prisma.product.findUniqueOrThrow({
      where: { productID },
      include: { productCategories: true, productImages: true },
    });
    assert.equal(afterFailure.name, input.name);
    assert.equal(afterFailure.visible, false);
    assert.equal(afterFailure.draft, true);
    assert.equal(afterFailure.productCategories[0]?.categoryID, categoryID);
    assert.equal(afterFailure.productImages[0]?.imageUrl, '/images/upload-test.png');
    await assert.rejects(saveProductUpdate(randomUUID(), parsed), /Product not found/);
  } finally {
    await prisma.product.deleteMany({ where: { productID } });
    await prisma.department.deleteMany({ where: { departmentID } });
    await prisma.$disconnect();
  }
});

test('database image changes add, retain, remove and reorder images atomically without accepting foreign references', {
  skip: process.env.RUN_DATABASE_TESTS !== 'true',
}, async () => {
  const { prisma } = await import('../src/prismaClient');
  const productID = randomUUID();
  const otherProductID = randomUUID();
  const originalIDs = [randomUUID(), randomUUID(), randomUUID()] as const;
  const foreignID = randomUUID();
  const directory = await mkdtemp(join(tmpdir(), 'product-image-order-test-'));
  const upload = input.images[0];
  assert.ok(upload);
  try {
    await prisma.product.create({
      data: {
        productID,
        name: 'Before',
        quantity: 1,
        weight: 1,
        productImages: {
          create: originalIDs.map((imageID, imageOrder) => ({
            imageID,
            imageUrl: `/images/${imageID}.png`,
            imageOrder,
          })),
        },
      },
    });
    await prisma.product.create({
      data: {
        productID: otherProductID,
        name: 'Other product',
        quantity: 1,
        weight: 1,
        productImages: {
          create: { imageID: foreignID, imageUrl: '/images/other.png', imageOrder: 0 },
        },
      },
    });
    const values = { ...input, categoryIDs: [] };
    const mixed = productUpdateSchema.parse({
      ...values,
      images: [{ imageID: originalIDs[2] }, upload, { imageID: originalIDs[0] }],
    });
    await updateProduct(productID, mixed, saveProductUpdate, directory);
    const readImages = () =>
      prisma.productImage.findMany({
        where: { productID },
        orderBy: { imageOrder: 'asc' },
      });
    const added = await readImages();
    assert.deepEqual(
      added.map((image) => image.imageOrder),
      [0, 1, 2],
    );
    assert.equal(added[0]?.imageID, originalIDs[2]);
    assert.equal(added[2]?.imageID, originalIDs[0]);
    assert.equal(await prisma.productImage.count({ where: { imageID: originalIDs[1] } }), 0);
    const newImage = added[1];
    assert.ok(newImage);
    assert.match(newImage.imageUrl, /^\/images\/upload-[\w-]+\.png$/);
    const fileName = newImage.imageUrl.slice('/images/'.length);
    assert.deepEqual(await readFile(join(directory, fileName)), png);

    await updateProduct(
      productID,
      productUpdateSchema.parse({
        ...values,
        images: [{ imageID: newImage.imageID }, { imageID: originalIDs[0] }],
      }),
      saveProductUpdate,
      directory,
    );
    const reordered = await readImages();
    assert.deepEqual(
      reordered.map((image) => image.imageID),
      [newImage.imageID, originalIDs[0]],
    );
    assert.deepEqual(
      reordered.map((image) => image.imageOrder),
      [0, 1],
    );
    assert.equal(reordered[0]?.imageUrl, newImage.imageUrl);
    assert.deepEqual(await readdir(directory), [fileName]);

    for (const imageID of [foreignID, originalIDs[2]]) {
      await assert.rejects(
        updateProduct(
          productID,
          productUpdateSchema.parse({
            ...values,
            name: 'Must roll back',
            images: [{ imageID }, upload],
          }),
          saveProductUpdate,
          directory,
        ),
        /image is no longer available/,
      );
      assert.deepEqual(await readImages(), reordered);
      assert.deepEqual(await readdir(directory), [fileName]);
      assert.equal(
        (await prisma.product.findUniqueOrThrow({ where: { productID } })).name,
        input.name,
      );
    }
    assert.equal(
      await prisma.productImage.count({
        where: { imageID: foreignID, productID: otherProductID },
      }),
      1,
    );

    await updateProduct(
      productID,
      productUpdateSchema.parse({
        ...values,
        images: undefined,
      }),
      saveProductUpdate,
      directory,
    );
    assert.deepEqual(await readImages(), reordered);
    await updateProduct(
      productID,
      productUpdateSchema.parse({
        ...values,
        images: [],
      }),
      saveProductUpdate,
      directory,
    );
    assert.deepEqual(await readImages(), []);
    await updateProduct(
      productID,
      productUpdateSchema.parse({
        ...values,
        images: [upload],
      }),
      saveProductUpdate,
      directory,
    );
    const afterClear = await readImages();
    assert.equal(afterClear.length, 1);
    assert.equal(afterClear[0]?.imageOrder, 0);
  } finally {
    await prisma.product.deleteMany({
      where: { productID: { in: [productID, otherProductID] } },
    });
    await prisma.$disconnect();
    await rm(directory, { recursive: true });
  }
});
