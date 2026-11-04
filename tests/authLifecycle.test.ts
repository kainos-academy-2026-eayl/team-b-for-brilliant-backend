import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createAuthRouter } from '../src/controllers/auth';
import { createSession } from '../src/services/sessions';

process.env.JWT_SECRET ??= randomBytes(32).toString('hex');

function app() {
  const api = express();
  api.use(
    '/auth',
    createAuthRouter({
      verifyCredentials: async () => ({
        status: 'valid',
        customerId: 'customer-1',
        accessLevel: 0,
      }),
      uniqueEmail: async () => ({ unique: true }),
    }),
  );
  return api;
}

test('session endpoint verifies the signed JWT and logout revokes a retained copy', async () => {
  const api = app();
  const login = await request(api)
    .post('/auth/verify')
    .send({ email: 'user@example.com', password: 'password123' })
    .expect(200);
  const token = login.body.accessToken;
  const current = await request(api)
    .get('/auth/session')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.deepEqual(current.body, { customerId: 'customer-1', accessLevel: 0 });
  assert.equal(current.headers['cache-control'], 'no-store');
  await request(api).post('/auth/logout').set('Authorization', `Bearer ${token}`).expect(204);
  await request(api).get('/auth/session').set('Authorization', `Bearer ${token}`).expect(401);
  await request(api).post('/auth/logout').set('Authorization', `Bearer ${token}`).expect(204);
});

test('session endpoint rejects expired, forged, unsigned and absent tokens', async () => {
  const api = app();
  const expired = createSession('customer-1', 0);
  for (const token of [expired, 'forged', 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJjdXN0b21lci0xIn0.', '']) {
    await request(api).get('/auth/session').set('Authorization', `Bearer ${token}`).expect(401);
  }
  await request(api).get('/auth/session').expect(401);
});
