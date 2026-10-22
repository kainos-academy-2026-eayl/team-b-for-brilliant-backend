import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import { createAuthRouter } from '../src/controllers/login';
import { verifyCredentials } from '../src/services/login';
import { hashPassword, verifyPassword } from '../src/services/passwords';

let passwordHash: string;
before(async () => {
  passwordHash = await hashPassword('correct password');
});

function appWith(verify: typeof verifyCredentials) {
  return express().use(express.json()).use('/auth', createAuthRouter(verify));
}

test('password hashes use a random salt and verify only the correct password', async () => {
  assert.notEqual(await hashPassword('correct password'), passwordHash);
  assert.equal(await verifyPassword('correct password', passwordHash), true);
  assert.equal(await verifyPassword('incorrect password', passwordHash), false);
  await assert.rejects(verifyPassword('password', 'plaintext'), /unsupported format/);
});

test('service returns only customerId for matching credentials', async () => {
  const result = await verifyCredentials('jane@example.com', 'correct password', async (email) => {
    assert.equal(email, 'jane@example.com');
    return { customerId: 'customer-1', passwordHash };
  });
  assert.deepEqual(result, { customerId: 'customer-1' });
});

test('service rejects incorrect passwords and missing customers', async () => {
  assert.equal(
    await verifyCredentials('jane@example.com', 'wrong', async () => ({
      customerId: 'customer-1',
      passwordHash,
    })),
    null,
  );
  assert.equal(await verifyCredentials('unknown@example.com', 'wrong', async () => null), null);
});

test('service propagates database errors', async () => {
  await assert.rejects(
    verifyCredentials('jane@example.com', 'correct', async () => {
      throw new Error('Database unavailable');
    }),
    /Database unavailable/,
  );
});

test('POST /auth/verify normalises email and returns the exact success contract', async () => {
  const app = appWith(async (email, password) => {
    assert.equal(email, 'jane@example.com');
    assert.equal(password, 'correct password');
    return { customerId: 'customer-1' };
  });
  const response = await request(app)
    .post('/auth/verify')
    .send({ email: ' Jane@example.com ', password: 'correct password' })
    .expect(200);
  assert.deepEqual(response.body, { customerId: 'customer-1' });
});

test('POST /auth/verify returns 401 for incorrect credentials', async () => {
  const response = await request(appWith(async () => null))
    .post('/auth/verify')
    .send({ email: 'jane@example.com', password: 'wrong' })
    .expect(401);
  assert.deepEqual(response.body, { error: 'Email or password is incorrect' });
});

test('POST /auth/verify logs failures and returns 503 without database details', async (t) => {
  const log = t.mock.method(console, 'error', () => {});
  const response = await request(
    appWith(async () => {
      throw new Error('Database unavailable');
    }),
  )
    .post('/auth/verify')
    .send({ email: 'jane@example.com', password: 'correct' })
    .expect(503);
  assert.deepEqual(response.body, { error: 'We could not sign you in right now' });
  assert.equal(log.mock.callCount(), 1);
});

test('invalid input is rejected before accessing the database', async () => {
  let calls = 0;
  const app = appWith(async () => {
    calls++;
    return null;
  });
  for (const body of [
    {},
    { email: 'invalid', password: 'x' },
    { email: 'jane@example.com', password: 123 },
    { email: 'jane@example.com', password: '' },
  ]) {
    await request(app).post('/auth/verify').send(body).expect(400);
  }
  assert.equal(calls, 0);
});

test('the application mounts the auth router', async () => {
  await request(createApp()).post('/auth/verify').send({}).expect(400);
});
