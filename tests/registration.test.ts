import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createRegistrationRouter } from '../src/controllers/registration';
import { HttpError } from '../src/errors/httpError';
import { registerCustomer } from '../src/services/registration';
import { getCustomerIDForToken } from '../src/services/sessions';

function registrationApp(register: typeof registerCustomer) {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', createRegistrationRouter(register));
  return app;
}

test('registration rejects an existing email with HTTP 400', async () => {
  await assert.rejects(
    registerCustomer('existing@example.com', 'password123', async () => null),
    (error: unknown) =>
      error instanceof HttpError && error.status === 400 && error.message === 'Invalid details',
  );
});

test('duplicate registration returns a message and error after email normalization', async (testContext) => {
  const log = testContext.mock.method(console, 'error', () => {});
  const app = registrationApp((email, password) =>
    registerCustomer(email, password, async (normalizedEmail) => {
      assert.equal(normalizedEmail, 'existing@example.com');
      return null;
    }),
  );
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: ' Existing@Example.com ', password: 'password123' })
    .expect(400);
  assert.deepEqual(response.body, {
    message: 'Invalid details',
    error: 'Invalid details',
  });
  assert.equal(log.mock.callCount(), 0);
});

test('registration returns the newly created customer ID', async () => {
  const result = await registerCustomer('new@example.com', 'password123', async (_email, hash) => {
    assert.notEqual(hash, 'password123');
    return { customerID: 'new-user' };
  });
  assert.deepEqual(result, { customerID: 'new-user' });
});

test('registration propagates storage failures', async () => {
  const error = new Error('Storage unavailable');
  await assert.rejects(
    registerCustomer('new@example.com', 'password123', async () => {
      throw error;
    }),
    error,
  );
});

test('registration normalizes email and returns a response without email instructions', async () => {
  const app = registrationApp(async (email, password) => {
    assert.equal(email, 'new@example.com');
    assert.equal(password, 'password123');
    return { customerID: 'new-user' };
  });
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: ' New@Example.com ', password: 'password123' })
    .expect(202);
  assert.equal(response.body.message, 'Registration request processed');
  assert.equal(response.body.customerId, 'new-user');
  assert.equal(response.body.accessLevel, 0);
  assert.equal(await getCustomerIDForToken(response.body.accessToken), 'new-user');
});

test('duplicate registration does not issue a JWT', async () => {
  const app = registrationApp((email, password) =>
    registerCustomer(email, password, async () => null),
  );
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'existing@example.com', password: 'password123' })
    .expect(400);
  assert.deepEqual(response.body, {
    message: 'Invalid details',
    error: 'Invalid details',
  });
});

test('invalid registration input is rejected before creating an account', async () => {
  const app = registrationApp(async () => {
    assert.fail('Registration must not run for invalid input');
  });
  for (const body of [
    { email: 'invalid', password: 'password123' },
    { email: 'new@example.com', password: 'short' },
    { email: 'new@example.com' },
    { email: 'new@example.com', password: 'password123', token: 'unused' },
  ]) {
    const response = await request(app).post('/api/v1/auth/register').send(body).expect(400);
    assert.equal(response.body.message, 'Invalid details');
    assert.equal(response.body.error, 'Invalid details');
    assert.deepEqual(
      response.body.details.formErrors,
      body.token ? ['Unrecognized key: "token"'] : [],
    );
    if (!body.token) {
      assert.ok(Object.keys(response.body.details.fieldErrors).length > 0);
    }
  }
});

test('removed verification endpoints return 404', async () => {
  const app = registrationApp(async () => {
    assert.fail('Registration must not run for removed endpoints');
  });
  await request(app).post('/api/v1/auth/verify-email').send({ token: 'unused' }).expect(404);
  await request(app)
    .post('/api/v1/auth/resend-verification')
    .send({ email: 'new@example.com' })
    .expect(404);
});

test('registration failures return an error rather than success', async (testContext) => {
  const log = testContext.mock.method(console, 'error', () => {});
  const app = registrationApp(async () => {
    throw new Error('Storage unavailable');
  });
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'new@example.com', password: 'password123' })
    .expect(500);
  assert.deepEqual(response.body, {
    message: 'Something went wrong',
    error: 'Something went wrong',
  });
  assert.equal(log.mock.callCount(), 1);
});
