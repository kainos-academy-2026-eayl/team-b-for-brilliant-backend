import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import request from 'supertest';
import sharp from 'sharp';
import { createApp } from '../src/app';
import { createSession } from '../src/services/sessions';

test('products link all selected existing categories without creating or changing category records', {
  skip: process.env.RUN_DATABASE_TESTS !== 'true',
}, async (context) => {
  const { prisma } = await import('../src/prismaClient');
  const categoriesBefore = await prisma.category.findMany({ orderBy: { categoryID: 'asc' } });
  assert.ok(categoriesBefore.length >= 2, 'Database category integration test requires at least two existing categories');
  const categoryIDs = categoriesBefore.map((category) => category.categoryID);
  const name = `category-product-${randomUUID()}`;
  const directory = await mkdtemp(path.join(tmpdir(), 'brilliant-product-categories-'));
  const previous = process.env.PRODUCT_IMAGE_DIR;
  process.env.PRODUCT_IMAGE_DIR = directory;
  context.after(async () => {
    try {
      await prisma.product.deleteMany({ where: { name: { in: [name, `${name}-unknown`] } } });
      await rm(directory, { recursive: true });
    } finally {
      if (previous === undefined) delete process.env.PRODUCT_IMAGE_DIR;
      else process.env.PRODUCT_IMAGE_DIR = previous;
      await prisma.$disconnect();
    }
  });
  const app = createApp();
  const token = createSession('category-integration-admin', Date.now(), 1);
  const listed = await request(app).get('/categories').set('Authorization', `Bearer ${token}`).expect(200);
  assert.deepEqual(listed.body.categories.map((category: { categoryID: string }) => category.categoryID).sort(), [...categoryIDs].sort());
  const created = await request(app).post('/products').set('Authorization', `Bearer ${token}`)
    .send({ name, quantity: 1, weight: 1, categoryIDs, price: '19.99' }).expect(201);
  assert.deepEqual(created.body.product.categories.map((category: { categoryID: string }) => category.categoryID).sort(), [...categoryIDs].sort());
  assert.equal(await prisma.productCategories.count({ where: { productID: created.body.product.productID } }), categoryIDs.length);
  const image = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#52dfdd' } }).png().toBuffer();
  const unknown = await request(app).post('/products').set('Authorization', `Bearer ${token}`)
    .field('name', `${name}-unknown`).field('quantity', '1').field('weight', '1')
    .field('price', '19.99').field('categoryIDs', JSON.stringify([...categoryIDs, `missing-${randomUUID()}`]))
    .attach('images', image, 'category-test.png').expect(400);
  assert.ok(unknown.body.details.fieldErrors.categoryIDs);
  assert.equal(await prisma.product.count({ where: { name: `${name}-unknown` } }), 0);
  assert.deepEqual(await readdir(directory), []);
  assert.deepEqual(await prisma.category.findMany({ orderBy: { categoryID: 'asc' } }), categoriesBefore);
});
