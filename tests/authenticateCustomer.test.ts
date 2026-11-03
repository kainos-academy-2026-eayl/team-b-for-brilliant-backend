import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import { createAuthenticateCustomer } from '../src/middleware/authenticateCustomer';
import { requireAdmin } from '../src/middleware/requireAdmin';
import { requireCustomer } from '../src/middleware/requireCustomer';
import { createSession, endSession, getCustomerIDForToken } from '../src/services/sessions';

function createProtectedApp() {
  const app = express();
  app.use(createAuthenticateCustomer());
  app.get('/whoami', requireCustomer, (_req, res) => {
    res.json({ customerID: res.locals.customerID });
  });
  return app;
}

test('a valid JWT identifies the customer and has a one-day lifetime', async () => {
  const token = createSession('customer-1');
  const response = await request(createProtectedApp())
    .get('/whoami')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.deepEqual(response.body, { customerID: 'customer-1' });
  const encodedPayload = token.split('.')[1];
  assert.ok(encodedPayload);
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  assert.equal(payload.sub, 'customer-1');
  assert.equal(payload.accessLevel, 0);
  assert.equal(payload.exp - payload.iat, 24 * 60 * 60);
});

test('requests without a token, or with a bad token, are rejected', async () => {
  const app = createProtectedApp();
  await request(app).get('/whoami').expect(401);
  await request(app).get('/whoami').set('Authorization', 'Bearer not-a-real-token').expect(401);
  await request(app).get('/whoami').set('Authorization', 'Bearer ').expect(401);
  await request(app).get('/whoami').set('Authorization', 'Basic abc').expect(401);
});

test('a customer ID supplied by the caller is never trusted', async () => {
  const app = createProtectedApp();
  await request(app).get('/whoami').set('x-customer-id', 'customer-1').expect(401);
  await request(app).get('/whoami?customerID=customer-1').expect(401);

  const token = createSession('customer-2');
  const response = await request(app)
    .get('/whoami?customerID=customer-1')
    .set('x-customer-id', 'customer-1')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.equal(response.body.customerID, 'customer-2');
});

test('an identity set earlier in the request is overwritten by the token check', async () => {
  const app = express();
  app.use((_req, res, next) => {
    res.locals.customerID = 'forged';
    next();
  });
  app.use(createAuthenticateCustomer());
  app.get('/whoami', requireCustomer, (_req, res) => {
    res.json({ customerID: res.locals.customerID });
  });

  await request(app).get('/whoami').expect(401);
});

test('ended and expired sessions stop working', () => {
  const token = createSession('customer-3', 0);
  assert.equal(getCustomerIDForToken(token, 1000), 'customer-3');
  assert.equal(getCustomerIDForToken(token, 24 * 60 * 60 * 1000), null);

  const other = createSession('customer-4');
  assert.equal(endSession(other), true);
  assert.equal(getCustomerIDForToken(other), null);
});

test('only a verified admin access-level claim passes admin authorization', async () => {
  const app = express();
  app.use(createAuthenticateCustomer());
  app.get('/admin', requireCustomer, requireAdmin, (_req, res) => {
    res.json({ ok: true });
  });

  await request(app).get('/admin').expect(401);
  await request(app)
    .get('/admin')
    .set('Authorization', `Bearer ${createSession('customer-1')}`)
    .expect(403);
  await request(app)
    .get('/admin')
    .set('Authorization', `Bearer ${createSession('admin-1', Date.now(), 1)}`)
    .expect(200);
});

test('changing a customer JWT claim to admin invalidates its signature', async () => {
  const token = createSession('customer-1');
  const [header, encodedPayload, signature] = token.split('.');
  assert.ok(encodedPayload);
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  payload.accessLevel = 1;
  const modifiedToken = `${header}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${signature}`;

  const app = express();
  app.use(createAuthenticateCustomer());
  app.get('/admin', requireCustomer, requireAdmin, (_req, res) => {
    res.json({ ok: true });
  });
  await request(app).get('/admin').set('Authorization', `Bearer ${modifiedToken}`).expect(401);
});

test('session tokens are unique and unguessable in length', () => {
  const TokenA = createSession('customer-5');
  const TokenB = createSession('customer-5');
  assert.notEqual(TokenA, TokenB);
  assert.ok(TokenA.length >= 43);
});

test('basket and checkout routes reject unauthenticated requests', async () => {
  const app = createApp();
  await request(app).get('/basket').expect(401);
  await request(app).post('/basket/items').send({ productID: 'p', quantity: 1 }).expect(401);
  await request(app).patch('/basket/items/p').send({ quantity: 1 }).expect(401);
  await request(app).delete('/basket/items/p').expect(401);
  await request(app).post('/checkout').expect(401);
  await request(app).get('/basket').set('x-customer-id', 'customer-1').expect(401);
});
