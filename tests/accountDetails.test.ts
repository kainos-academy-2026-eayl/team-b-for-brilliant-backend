import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createAccountDetailsRouter } from '../src/controllers/accountDetails';
import { createAuthenticateCustomer } from '../src/middleware/authenticateCustomer';
import type { saveAccountDetails } from '../src/repositories/accountDetails';
import { createSession, endSession } from '../src/services/sessions';

function detailsApp(save: typeof saveAccountDetails) {
  const app = express();
  app.use(express.json());
  app.use('/account', createAuthenticateCustomer(), createAccountDetailsRouter(save));
  return app;
}

test('profile updates require a valid token, not a submitted customer identity', async () => {
  const app = detailsApp(async () => {
    assert.fail('Unauthenticated requests must not save details');
  });
  for (const token of ['', 'invalid-token']) {
    await request(app)
      .put('/account/details')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerID: 'someone-else', firstname: 'Jane' })
      .expect(401);
  }
});

test('profile updates save only the token owner and normalize optional details', async () => {
  const token = createSession('customer-1');
  try {
    const app = detailsApp(async (customerID, details) => {
      assert.equal(customerID, 'customer-1');
      assert.deepEqual(details, {
        firstname: 'Jane',
        surname: 'Smith',
        addressLine1: '1 Main Street',
        addressLine2: '',
        postcode: 'BT1 1AA',
      });
      return { count: 1 };
    });
    await request(app)
      .put('/account/details')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstname: ' Jane ',
        surname: 'Smith',
        addressLine1: '1 Main Street',
        postcode: 'BT1 1AA',
      })
      .expect(204);
  } finally {
    endSession(token);
  }
});

test('all profile details are optional', async () => {
  const token = createSession('customer-1');
  try {
    const app = detailsApp(async (_customerID, details) => {
      assert.deepEqual(details, {
        firstname: '',
        surname: '',
        addressLine1: '',
        addressLine2: '',
        postcode: '',
      });
      return { count: 1 };
    });
    await request(app)
      .put('/account/details')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(204);
  } finally {
    endSession(token);
  }
});

test('profile validation rejects oversized fields and protected properties before storage', async () => {
  const token = createSession('customer-1');
  try {
    const app = detailsApp(async () => {
      assert.fail('Invalid details must not reach storage');
    });
    for (const body of [
      { firstname: 'x'.repeat(101) },
      { surname: [] },
      { addressLine1: 'x'.repeat(256) },
      { postcode: 'x'.repeat(21) },
      { roleID: 'admin' },
      { userID: 'someone-else' },
      { securityAnswer: 'secret' },
      { passwordHash: 'replacement' },
    ]) {
      await request(app)
        .put('/account/details')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);
    }
  } finally {
    endSession(token);
  }
});

test('missing customers and storage failures do not return success', async () => {
  const token = createSession('deleted-customer');
  try {
    await request(detailsApp(async () => ({ count: 0 })))
      .put('/account/details')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstname: 'Jane' })
      .expect(404);
    const app = detailsApp(async () => {
      throw new Error('Storage unavailable');
    });
    app.use(
      (error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        assert.equal(error.message, 'Storage unavailable');
        res.status(500).json({ error: 'Storage unavailable' });
      },
    );
    await request(app)
      .put('/account/details')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstname: 'Jane' })
      .expect(500);
  } finally {
    endSession(token);
  }
});
