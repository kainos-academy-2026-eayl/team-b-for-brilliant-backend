import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';
import { verifyCredentials } from '../src/services/auth';
import { hashPassword, verifyPassword } from '../src/utils/password';

const noProducts = async () => [];

function appWith(result: Awaited<ReturnType<typeof verifyCredentials>>) {
  const auth = { verifyCredentials: async () => result };
  return createApp(noProducts, undefined, auth);
}

test('verifyPassword accepts the right password and rejects others', async () => {
  const hash = await hashPassword('password');

  assert.equal(await verifyPassword('password', hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
  assert.equal(await verifyPassword('password', 'password'), false);
});

test('verifyCredentials returns not_found, invalid and valid', async () => {
  const passwordHash = await hashPassword('password');
  const customer = { customerID: 'C1', passwordHash, mfaEnabled: true };

  assert.deepEqual(await verifyCredentials('a@b.c', 'password', async () => null), {
    status: 'not_found',
  });
  assert.deepEqual(await verifyCredentials('a@b.c', 'nope', async () => customer), {
    status: 'invalid',
  });
  assert.deepEqual(await verifyCredentials('a@b.c', 'password', async () => customer), {
    status: 'valid',
    customerId: 'C1',
    mfaEnabled: true,
  });
});

test('POST /auth/verify returns 200 with the customer for valid credentials', async () => {
  const response = await request(appWith({ status: 'valid', customerId: 'C1', mfaEnabled: false }))
    .post('/auth/verify')
    .send({ email: 'customer@gmail.com', password: 'password' })
    .expect(200);

  assert.deepEqual(response.body, { customerId: 'C1', mfaEnabled: false });
});

test('POST /auth/verify returns 401 for a wrong password', async () => {
  await request(appWith({ status: 'invalid' }))
    .post('/auth/verify')
    .send({ email: 'customer@gmail.com', password: 'wrong' })
    .expect(401);
});

test('POST /auth/verify returns 404 for an unknown email', async () => {
  await request(appWith({ status: 'not_found' }))
    .post('/auth/verify')
    .send({ email: 'nobody@gmail.com', password: 'password' })
    .expect(404);
});

test('POST /auth/verify returns 400 when email or password is missing', async () => {
  const app = createApp(noProducts, undefined, {
    verifyCredentials: async () => {
      throw new Error('should not be called');
    },
  });

  await request(app).post('/auth/verify').send({ email: 'customer@gmail.com' }).expect(400);
  await request(app).post('/auth/verify').expect(400);
});

test('GET /auth/verify is not exposed', async () => {
  await request(appWith({ status: 'invalid' }))
    .get('/auth/verify')
    .expect(404);
});
