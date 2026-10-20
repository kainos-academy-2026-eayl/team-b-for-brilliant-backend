import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from './app';

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
