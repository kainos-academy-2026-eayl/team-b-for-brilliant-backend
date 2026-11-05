import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import sharp from 'sharp';
import request from 'supertest';
import { createApp } from '../src/app';
import { createProduct } from '../src/services/products';
import { createSession } from '../src/services/sessions';

test('admin creation derives visibility from draft status and ignores supplied visibility', {
  skip: process.env.RUN_DATABASE_TESTS !== 'true',
}, async (context) => {
  const { prisma } = await import('../src/prismaClient');
  const name = `product-create-${randomUUID()}`;
  context.after(async () => {
    try {
      await prisma.product.deleteMany({ where: { name } });
    } finally {
      await prisma.$disconnect();
    }
  });

  const token = createSession('admin-product-database-test', Date.now(), 1);
  for (const flags of [{}, { draft: true, visible: true }, { draft: false, visible: false }]) {
    const response = await request(createApp())
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name, quantity: 0, weight: 1.5, ...flags })
      .expect(201);
    const stored = await prisma.product.findUniqueOrThrow({
      where: { productID: response.body.product.productID },
    });
    assert.equal(stored.name, name);
    assert.equal(stored.description, null);
    assert.equal(stored.quantity, 0);
    assert.equal(stored.weight, 1.5);
    assert.equal(stored.draft, flags.draft ?? true);
    assert.equal(stored.visible, !(flags.draft ?? true));
    assert.equal(response.body.product.visible, !(flags.draft ?? true));
    assert.equal(stored.salesNo, 0);
    assert.equal(stored.deletedAt, null);
    assert.deepEqual(response.body.product.productImages, []);
    assert.deepEqual(response.body.product.categories, []);
    assert.deepEqual(response.body.product.departments, []);
  }
});

test('multipart creation persists price and ordered images, and rolls back nested write failures', {
  skip: process.env.RUN_DATABASE_TESTS !== 'true',
}, async (context) => {
  const { prisma } = await import('../src/prismaClient');
  const name = `product-upload-${randomUUID()}`;
  const directory = await mkdtemp(path.join(tmpdir(), 'brilliant-product-database-'));
  const previous = process.env.PRODUCT_IMAGE_DIR;
  process.env.PRODUCT_IMAGE_DIR = directory;
  context.after(async () => {
    try {
      await prisma.product.deleteMany({ where: { name: { in: [name, `${name}-fail`] } } });
      await rm(directory, { recursive: true });
    } finally {
      if (previous === undefined) delete process.env.PRODUCT_IMAGE_DIR;
      else process.env.PRODUCT_IMAGE_DIR = previous;
      await prisma.$disconnect();
    }
  });
  const app = createApp();
  const token = createSession('admin-upload-database-test', Date.now(), 1);
  const buffer = await sharp({
    create: { width: 4, height: 4, channels: 3, background: '#52dfdd' },
  })
    .png()
    .toBuffer();
  const secondBuffer = await sharp({
    create: { width: 4, height: 4, channels: 3, background: '#028aa4' },
  })
    .png()
    .toBuffer();
  const response = await request(app)
    .post('/products')
    .set('Authorization', `Bearer ${token}`)
    .field('name', name)
    .field('quantity', '4')
    .field('weight', '1.25')
    .field('price', '19.99')
    .field('visible', 'false')
    .field('draft', 'false')
    .attach('images', buffer, 'first.png')
    .attach('images', secondBuffer, 'second.png')
    .expect(201);
  const productID: string = response.body.product.productID;
  const stored = await prisma.product.findUniqueOrThrow({
    where: { productID },
    include: { productPrices: true, productImages: true },
  });
  assert.equal(stored.productPrices[0]?.price.toFixed(2), '19.99');
  assert.equal(stored.visible, true);
  assert.deepEqual(stored.productImages.map((item) => item.imageOrder).sort(), [0, 1]);
  const orderedImages = [...stored.productImages].sort(
    (firstImage, secondImage) => firstImage.imageOrder - secondImage.imageOrder,
  );
  for (const [index, image] of orderedImages.entries()) {
    const pixels = await sharp(path.join(directory, path.basename(image.imageUrl)))
      .removeAlpha()
      .raw()
      .toBuffer();
    const expected = index === 0 ? [82, 223, 221] : [2, 138, 164];
    for (const [channel, value] of expected.entries()) {
      assert.ok(
        Math.abs((pixels[channel] ?? -255) - value) <= 3,
        'Image content must match its persisted order',
      );
    }
  }
  const currentPrice = await request(app).get(`/products/${productID}/prices/current`).expect(200);
  assert.equal(currentPrice.body.price.price, '19.99');
  for (const image of stored.productImages) {
    await request(app)
      .get(image.imageUrl)
      .expect(200)
      .expect('Content-Type', /image\/webp/);
  }
  const filesBefore = await readdir(directory);
  await assert.rejects(
    createProduct(
      {
        name: `${name}-fail`,
        quantity: 0,
        weight: 0,
        price: '100000000.00',
      },
      [{ buffer, mimetype: 'image/png' }],
    ),
  );
  assert.equal(await prisma.product.count({ where: { name: `${name}-fail` } }), 0);
  assert.deepEqual(await readdir(directory), filesBefore);
  await request(app)
    .post('/products')
    .set('Authorization', `Bearer ${token}`)
    .field('name', `${name}-fail`)
    .field('quantity', '0')
    .field('weight', '0')
    .field('price', '1')
    .attach('images', Buffer.from('not an image'), {
      filename: 'forged.png',
      contentType: 'image/png',
    })
    .expect(400);
  assert.equal(await prisma.product.count({ where: { name: `${name}-fail` } }), 0);
  assert.deepEqual(await readdir(directory), filesBefore);
});
