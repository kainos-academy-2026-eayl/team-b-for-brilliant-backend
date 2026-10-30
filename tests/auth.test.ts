import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createAuthRouter } from '../src/controllers/auth';
import { uniqueEmail, verifyCredentials } from '../src/services/auth';
import { hashPassword } from '../src/services/password';

function authApp(verify: typeof verifyCredentials) {
  const app = express();
  app.use(
    '/auth',
    createAuthRouter(
      {
        verifyCredentials: verify,
        uniqueEmail: async () => {
          assert.fail('Email uniqueness must not be checked during credential verification');
        },
      },
      (customerID) => `token-for-${customerID}`,
    ),
  );
  return app;
}

test('valid credentials return the user ID without an MFA flag', async () => {
  const passwordHash = await hashPassword('password123');
  const result = await verifyCredentials(' user@example.com ', 'password123', async (email) => {
    assert.equal(email, 'user@example.com');
    return { customerID: 'user-1', passwordHash };
  });
  assert.deepEqual(result, { status: 'valid', customerId: 'user-1' });
});

test('incorrect passwords remain invalid', async () => {
  const passwordHash = await hashPassword('password123');
  const result = await verifyCredentials('user@example.com', 'incorrect', async () => ({
    customerID: 'user-1',
    passwordHash,
  }));
  assert.deepEqual(result, { status: 'invalid' });
});

test('unknown accounts remain not found', async () => {
  assert.deepEqual(
    await verifyCredentials('missing@example.com', 'password123', async () => null),
    { status: 'not_found' },
  );
});

test('credential lookup failures propagate', async () => {
  const error = new Error('Database unavailable');
  await assert.rejects(
    verifyCredentials('user@example.com', 'password123', async () => {
      throw error;
    }),
    error,
  );
});

test('the credentials endpoint returns the customerId and a session token on success', async () => {
  const app = authApp(async (email, password) => {
    assert.equal(email, 'user@example.com');
    assert.equal(password, 'password123');
    return { status: 'valid', customerId: 'user-1' };
  });
  const response = await request(app)
    .post('/auth/verify')
    .send({ email: 'user@example.com', password: 'password123' })
    .expect(200);
  assert.deepEqual(response.body, { customerId: 'user-1', token: 'token-for-user-1' });
});

test('the credentials endpoint preserves invalid and missing account responses', async () => {
  const invalid = await request(authApp(async () => ({ status: 'invalid' })))
    .post('/auth/verify')
    .send({ email: 'user@example.com', password: 'incorrect' })
    .expect(401);
  assert.deepEqual(invalid.body, { error: 'Invalid credentials' });

  const missing = await request(authApp(async () => ({ status: 'not_found' })))
    .post('/auth/verify')
    .send({ email: 'missing@example.com', password: 'password123' })
    .expect(404);
  assert.deepEqual(missing.body, { error: 'Customer not found' });
});

test('the credentials endpoint rejects invalid input before lookup', async () => {
  const app = authApp(async () => {
    assert.fail('Invalid input must not reach credential lookup');
  });
  for (const body of [
    {},
    { email: 'user@example.com' },
    { email: '', password: 'password123' },
    { email: 'user@example.com', password: '' },
  ]) {
    const response = await request(app).post('/auth/verify').send(body).expect(400);
    assert.deepEqual(response.body, { error: 'email and password are required' });
  }
});

test('email uniqueness responds with a boolean for both new and existing accounts', async () => {
  for (const unique of [true, false]) {
    const app = express();
    app.use(
      '/auth',
      createAuthRouter({
        verifyCredentials: async () => {
          assert.fail('Credentials must not be checked during email lookup');
        },
        uniqueEmail: async (email) => {
          assert.equal(email, 'user@example.com');
          return { unique };
        },
      }),
    );
    const response = await request(app)
      .post('/auth/unique-email')
      .send({ email: 'user@example.com' })
      .expect(200);
    assert.deepEqual(response.body, { unique });
  }
});

test('email uniqueness rejects missing input before lookup', async () => {
  const app = express();
  app.use(
    '/auth',
    createAuthRouter({
      verifyCredentials: async () => {
        assert.fail('Credentials must not be checked during email lookup');
      },
      uniqueEmail: async () => {
        assert.fail('Invalid input must not reach email lookup');
      },
    }),
  );
  await request(app).post('/auth/unique-email').send({}).expect(400);
});

test('email uniqueness service distinguishes existing and missing accounts', async () => {
  assert.deepEqual(await uniqueEmail('user@example.com', async () => null), { unique: true });
  assert.deepEqual(
    await uniqueEmail('user@example.com', async () => ({
      customerID: 'user-1',
      passwordHash: 'unused',
    })),
    { unique: false },
  );
});
