import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createRegistrationRouter } from '../src/controllers/registration';
import { registerCustomer } from '../src/services/registration';

function registrationApp(register: typeof registerCustomer) {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', createRegistrationRouter(register));
  return app;
}

test('registration accepts an existing email without revealing it', async () => {
  await registerCustomer('existing@example.com', 'password123', async () => null);
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
  });
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: ' New@Example.com ', password: 'password123' })
    .expect(202);
  assert.deepEqual(response.body, { message: 'Registration request processed' });
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
    await request(app).post('/api/v1/auth/register').send(body).expect(400);
  }
});

test('removed verification endpoints return 404', async () => {
  const app = registrationApp(async () => {});
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
  assert.deepEqual(response.body, { error: 'Something went wrong' });
  assert.equal(log.mock.callCount(), 1);
});
