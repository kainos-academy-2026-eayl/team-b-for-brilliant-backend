import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createAuthRouter } from '../src/controllers/auth';
import { createRegistrationRouter } from '../src/controllers/registration';
import { uniqueEmail, verifyCredentials } from '../src/services/auth';
import { hashPassword } from '../src/services/password';
import { endSession } from '../src/services/sessions';

test('a mixed-case registration can immediately sign in with the submitted email', async () => {
  let stored: { email: string; passwordHash: string } | undefined;
  const findCustomer = async (email: string) =>
    stored?.email === email
      ? { customerID: 'customer-1', passwordHash: stored.passwordHash }
      : null;
  const app = express();
  app.use(express.json());
  app.use(
    '/api/v1/auth',
    createRegistrationRouter(async (email, password) => {
      stored = { email, passwordHash: await hashPassword(password) };
    }),
  );
  app.use(
    '/auth',
    createAuthRouter({
      verifyCredentials: (email, password) => verifyCredentials(email, password, findCustomer),
      uniqueEmail: (email) => uniqueEmail(email, findCustomer),
    }),
  );
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email: ' Mixed.Case@Example.com ', password: 'Password123' })
    .expect(202);
  assert.equal(stored?.email, 'mixed.case@example.com');

  for (const email of ['Mixed.Case@Example.com', ' mixed.case@example.com ']) {
    const response = await request(app)
      .post('/auth/verify')
      .send({ email, password: 'Password123' })
      .expect(200);
    assert.equal(response.body.customerId, 'customer-1');
    endSession(response.body.accessToken);
    const uniqueness = await request(app).post('/auth/unique-email').send({ email }).expect(200);
    assert.deepEqual(uniqueness.body, { unique: false });
  }
  await request(app)
    .post('/auth/verify')
    .send({ email: 'Mixed.Case@Example.com', password: 'password123' })
    .expect(401);
});

test('normalized unknown email addresses remain unique and cannot sign in', async () => {
  const findCustomer = async (email: string) => {
    assert.equal(email, 'missing@example.com');
    return null;
  };
  assert.deepEqual(await uniqueEmail(' Missing@Example.com ', findCustomer), { unique: true });
  assert.deepEqual(await verifyCredentials(' Missing@Example.com ', 'password123', findCustomer), {
    status: 'not_found',
  });
});
