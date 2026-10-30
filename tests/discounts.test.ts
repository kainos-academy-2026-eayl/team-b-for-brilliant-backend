import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';
import { discountServices } from '../src/controllers/discounts';
import { HttpError } from '../src/errors/httpError';
import { Prisma } from '../src/generated/prisma/client';
import { createAuthenticateCustomer } from '../src/middleware/authenticateCustomer';
import { createRequireAdmin } from '../src/middleware/requireAdmin';
import { deleteDiscount, getDiscounts } from '../src/services/discounts';
import { createSession } from '../src/services/sessions';

const savedDiscount = {
  discountID: 'discount-1',
  code: 'SUMMER10',
  type: 'PERCENTAGE' as const,
  value: new Prisma.Decimal('10'),
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  expiryDate: new Date('2026-12-31T00:00:00.000Z'),
};

function createTestApp(roleName: string | null, services = discountServices) {
  const roles = new Map([
    ['admin-1', 'admin'],
    ['customer-1', roleName ?? ''],
  ]);
  const requireAdmin = createRequireAdmin(async (userID) => {
    const name = roles.get(userID);
    return name ? name : null;
  });

  return createApp(
    undefined,
    undefined,
    undefined,
    undefined,
    createAuthenticateCustomer(),
    services,
    requireAdmin,
  );
}

test('getDiscounts maps stored discounts to DTOs', async () => {
  const result = await getDiscounts({
    findAllDiscounts: async () => [savedDiscount],
    deleteDiscountByID: async () => ({ count: 0 }),
  });

  assert.deepEqual(result, {
    discounts: [
      {
        discountID: 'discount-1',
        code: 'SUMMER10',
        type: 'PERCENTAGE',
        value: '10.00',
        expiryDate: '2026-12-31T00:00:00.000Z',
      },
    ],
  });
});

test('deleteDiscount throws 404 when nothing was deleted', async () => {
  await assert.rejects(
    deleteDiscount('missing', {
      findAllDiscounts: async () => [],
      deleteDiscountByID: async () => ({ count: 0 }),
    }),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});

test('GET /discounts requires login', async () => {
  const app = createTestApp('admin');
  await request(app).get('/discounts').expect(401);
});

test('GET /discounts rejects users who are not admins', async () => {
  const app = createTestApp('customer');
  const token = createSession('customer-1');
  await request(app).get('/discounts').set('Authorization', `Bearer ${token}`).expect(403);
});

test('GET /discounts rejects users with no role', async () => {
  const app = createTestApp(null);
  const token = createSession('customer-1');
  await request(app).get('/discounts').set('Authorization', `Bearer ${token}`).expect(403);
});

test('GET /discounts returns the list for an admin', async () => {
  const app = createTestApp('customer', {
    getDiscounts: async () => ({
      discounts: [
        {
          discountID: 'discount-1',
          code: 'SUMMER10',
          type: 'PERCENTAGE',
          value: '10.00',
          expiryDate: '2026-12-31T00:00:00.000Z',
        },
      ],
    }),
    deleteDiscount: async () => {},
  });
  const token = createSession('admin-1');
  const response = await request(app)
    .get('/discounts')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(response.body.discounts[0].code, 'SUMMER10');
  assert.equal(response.body.discounts[0].type, 'PERCENTAGE');
  assert.equal(response.body.discounts[0].value, '10.00');
});

test('DELETE /discounts/:discountID returns 204, 404 and refuses non-admins', async () => {
  const app = createTestApp('customer', {
    getDiscounts: async () => ({ discounts: [] }),
    deleteDiscount: async (discountID) => {
      if (discountID !== 'discount-1') {
        throw new HttpError(404, 'Discount not found');
      }
    },
  });
  const adminToken = createSession('admin-1');
  const customerToken = createSession('customer-1');

  await request(app)
    .delete('/discounts/discount-1')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(204);
  await request(app)
    .delete('/discounts/other')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404);
  await request(app)
    .delete('/discounts/discount-1')
    .set('Authorization', `Bearer ${customerToken}`)
    .expect(403);
});
