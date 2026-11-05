import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import sharp from 'sharp';
import request from 'supertest';
import { createApp } from '../src/app';
import { HttpError } from '../src/errors/httpError';
import { validateCreateProduct } from '../src/schemas/product';
import { withStoredProductImages } from '../src/services/productImages';
import { createSession } from '../src/services/sessions';

async function image() {
  return sharp({ create: { width: 4, height: 4, channels: 3, background: '#52dfdd' } })
    .png()
    .toBuffer();
}

test('uploads are decoded, normalized and ordered, with cleanup on persistence failure', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'brilliant-product-images-'));
  const original = process.env.PRODUCT_IMAGE_DIR;
  process.env.PRODUCT_IMAGE_DIR = directory;
  context.after(async () => {
    if (original === undefined) delete process.env.PRODUCT_IMAGE_DIR;
    else process.env.PRODUCT_IMAGE_DIR = original;
    await rm(directory, { recursive: true });
  });
  const buffer = await image();
  const files = [
    { buffer, mimetype: 'image/png' },
    { buffer, mimetype: 'image/png' },
  ];
  const stored = await withStoredProductImages(files, async (images) => images);
  assert.deepEqual(
    stored.map((item) => item.imageOrder),
    [0, 1],
  );
  assert.notEqual(stored[0]?.imageUrl, stored[1]?.imageUrl);
  for (const item of stored) {
    assert.match(item.imageUrl, /^\/images\/product-[a-f0-9-]+\.webp$/);
    const bytes = await readFile(path.join(directory, path.basename(item.imageUrl)));
    assert.equal((await sharp(bytes).metadata()).format, 'webp');
  }
  const before = await readdir(directory);
  await assert.rejects(
    withStoredProductImages(files, async () => {
      throw new Error('Database failed');
    }),
    /Database failed/,
  );
  assert.deepEqual(await readdir(directory), before);
});

test('invalid image bytes and image limits never call persistence', async () => {
  for (const files of [
    [{ buffer: Buffer.from('not a PNG'), mimetype: 'image/png' }],
    [{ buffer: Buffer.from('<svg></svg>'), mimetype: 'image/svg+xml' }],
    [{ buffer: Buffer.alloc(5 * 1024 * 1024 + 1), mimetype: 'image/png' }],
    Array.from({ length: 6 }, () => ({ buffer: Buffer.alloc(1), mimetype: 'image/png' })),
  ]) {
    await assert.rejects(
      withStoredProductImages(files, async () => assert.fail('Must not persist')),
      (error: unknown) => error instanceof HttpError && error.status === 400,
    );
  }
});

test('multipart price and fields validate exact decimal and numeric boundaries', () => {
  const input = { name: 'Test', quantity: '0', weight: '0', draft: 'false', price: '99999999.99' };
  const result = validateCreateProduct(input, true);
  assert.equal(result.success, true);
  if (!result.success) assert.fail('Expected valid multipart product');
  assert.deepEqual(result.data, { ...input, quantity: 0, weight: 0, draft: false });
  for (const price of ['-1', '1.234', '100000000', 'NaN', '1e2', '']) {
    assert.equal(validateCreateProduct({ ...input, price }, true).success, false);
  }
  assert.equal(validateCreateProduct({ ...input, price: '0' }, true).success, true);
});

test('multipart endpoint enforces authorization, upload limits and field validation', async () => {
  const app = createApp(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    async () => assert.fail('Invalid uploads must not persist'),
  );
  const token = createSession('upload-admin', Date.now(), 1);
  await request(app)
    .post('/products')
    .attach('images', await image(), 'test.png')
    .expect(401);
  await request(app)
    .post('/products')
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'Test')
    .field('quantity', '0')
    .field('weight', '1')
    .field('price', '-1')
    .attach('images', await image(), 'test.png')
    .expect(400);
  await request(app)
    .post('/products')
    .set('Authorization', `Bearer ${token}`)
    .attach('images', Buffer.from('<svg/>'), { filename: 'test.svg', contentType: 'image/svg+xml' })
    .expect(400);
  const excess = request(app).post('/products').set('Authorization', `Bearer ${token}`);
  for (let index = 0; index < 6; index++) excess.attach('images', await image(), `${index}.png`);
  await excess.expect(400);
  await request(app)
    .post('/products')
    .set('Authorization', `Bearer ${token}`)
    .attach('images', Buffer.alloc(5 * 1024 * 1024 + 1), 'large.png')
    .expect(400);
});
