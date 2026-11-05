import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createAccountDetailsRouter } from '../src/controllers/accountDetails';
import { createAuthenticateCustomer } from '../src/middleware/authenticateCustomer';
import { deleteAccount } from '../src/services/deleteAccount';
import {
  createSession,
  endSession,
  getCustomerIDForToken,
  revokeSessionsForCustomer,
} from '../src/services/sessions';

function accountApp(remove: typeof deleteAccount) {
  const app = express();
  app.use(express.json());
  app.use(
    '/account',
    createAuthenticateCustomer(),
    createAccountDetailsRouter(undefined, undefined, remove),
  );
  return app;
}

test('deleting an account requires a valid token', async () => {
  const app = accountApp(async () => {
    assert.fail('Unauthenticated requests must not delete anything');
  });

  for (const token of ['', 'invalid-token']) {
    await request(app).delete('/account').set('Authorization', `Bearer ${token}`).expect(401);
  }
});

test('deleting an account removes only the token owner, ignoring any submitted identity', async () => {
  const token = createSession('customer-1');
  try {
    const deleted: string[] = [];
    const app = accountApp(async (customerID) => {
      deleted.push(customerID);
    });

    await request(app)
      .delete('/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerID: 'someone-else' })
      .expect(204);

    assert.deepEqual(deleted, ['customer-1']);
  } finally {
    endSession(token);
  }
});

test('a missing account gives a 404', async () => {
  const token = createSession('customer-1');
  try {
    const app = accountApp((customerID) =>
      deleteAccount(
        customerID,
        async () => 0,
        () => assert.fail('Sessions must not be revoked when nothing was deleted'),
      ),
    );

    const response = await request(app)
      .delete('/account')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    assert.equal(response.body.error, 'Account not found');
  } finally {
    endSession(token);
  }
});

test('a storage failure gives a friendly 500 and does not revoke sessions', async () => {
  const token = createSession('customer-1');
  try {
    let revoked = false;
    const app = accountApp((customerID) =>
      deleteAccount(
        customerID,
        async () => {
          throw new Error('database unavailable');
        },
        () => {
          revoked = true;
        },
      ),
    );

    const response = await request(app)
      .delete('/account')
      .set('Authorization', `Bearer ${token}`)
      .expect(500);

    assert.equal(response.body.error, 'We could not delete your account. Please try again.');
    assert.equal(revoked, false);
    assert.equal(getCustomerIDForToken(token), 'customer-1');
  } finally {
    endSession(token);
  }
});

test('after deletion every token the customer held stops working', async () => {
  const firstToken = createSession('customer-to-delete');
  const secondToken = createSession('customer-to-delete');
  const otherToken = createSession('another-customer');
  try {
    await deleteAccount('customer-to-delete', async () => 1, revokeSessionsForCustomer);

    assert.equal(getCustomerIDForToken(firstToken), null);
    assert.equal(getCustomerIDForToken(secondToken), null);
    assert.equal(getCustomerIDForToken(otherToken), 'another-customer');

    const app = accountApp(async () => {
      assert.fail('A deleted customer must not reach the delete handler');
    });
    await request(app).delete('/account').set('Authorization', `Bearer ${firstToken}`).expect(401);
  } finally {
    endSession(otherToken);
  }
});
