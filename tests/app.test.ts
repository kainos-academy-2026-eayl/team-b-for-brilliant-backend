import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';

test('GET /health returns the service status and uptime', async () => {
  const response = await request(createApp())
    .get('/health')
    .expect('Content-Type', /json/)
    .expect(200);

  assert.equal(response.body.status, 'ok');
  assert.equal(typeof response.body.uptime, 'number');
  assert.ok(response.body.uptime >= 0);
});

test('GET /bookings returns an empty bookings list', async () => {
  const response = await request(createApp())
    .get('/bookings')
    .expect('Content-Type', /json/)
    .expect(200);

  assert.deepEqual(response.body, { bookings: [] });
});

test('GET /unknown returns not found', async () => {
  await request(createApp()).get('/unknown').expect(404);
});

test('GET /images/product-1.svg serves the product image', async () => {
  const response = await request(createApp())
    .get('/images/product-1.svg')
    .expect('Content-Type', /image\/svg\+xml/)
    .expect(200);

  assert.ok(Buffer.isBuffer(response.body));
  const svg = response.body.toString('utf8');
  assert.match(svg, /<svg /);
  assert.match(svg, /<title id="title">Hyaluronic Acid Serum in a glass dropper bottle<\/title>/);
});

test('missing images and image directory listings return not found', async () => {
  const app = createApp();
  await request(app).get('/images/missing.svg').expect(404);
  await request(app).get('/images/').expect(404);
});

test('static images do not expose files outside the image directory', async () => {
  await request(createApp()).get('/images/%2e%2e%2f%2e%2e%2fpackage.json').expect(404);
});
