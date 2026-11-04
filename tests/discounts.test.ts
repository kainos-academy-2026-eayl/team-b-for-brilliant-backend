import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';
import { discountServices } from '../src/controllers/discounts';
import { HttpError } from '../src/errors/httpError';
import { Prisma } from '../src/generated/prisma/client';
import { createAuthenticateCustomer } from '../src/middleware/authenticateCustomer';
import { validateCreateDiscount } from '../src/schemas/discount';
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

function createTestApp(services = discountServices) {
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
    createDiscountRecord: async () => null,
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
      createDiscountRecord: async () => null,
    }),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});

test('GET /discounts requires login', async () => {
  const app = createTestApp();
  await request(app).get('/discounts').expect(401);
});

test('GET /discounts rejects users who are not admins', async () => {
  const app = createTestApp();
  const token = createSession('customer-1');
  await request(app).get('/discounts').set('Authorization', `Bearer ${token}`).expect(403);
});

test('GET /discounts rejects users with no role', async () => {
  const app = createTestApp();
  const token = createSession('customer-1');
  await request(app).get('/discounts').set('Authorization', `Bearer ${token}`).expect(403);
});

test('GET /discounts returns the list for an admin', async () => {
  const app = createTestApp({
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
    deleteDiscount: async () => { },
    createDiscount: async () => {
      throw new Error('not used');
    },
  });
  const token = createSession('admin-1', Date.now(), 1);
  const response = await request(app)
    .get('/discounts')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(response.body.discounts[0].code, 'SUMMER10');
  assert.equal(response.body.discounts[0].type, 'PERCENTAGE');
  assert.equal(response.body.discounts[0].value, '10.00');
});

test('DELETE /discounts/:discountID returns 204, 404 and refuses non-admins', async () => {
  const app = createTestApp({
    getDiscounts: async () => ({ discounts: [] }),
    deleteDiscount: async (discountID) => {
      if (discountID !== 'discount-1') {
        throw new HttpError(404, 'Discount not found');
      }
    },
    createDiscount: async () => {
      throw new Error('not used');
    },
  });
  const adminToken = createSession('admin-1', Date.now(), 1);
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

const futureDate = '2999-12-31';
const validPercentage = {
  code: 'SUMMER10',
  type: 'PERCENTAGE',
  value: '10',
  expiryDate: futureDate,
};

test('validateCreateDiscount accepts valid percentage and amount discounts', () => {
  const percentage = validateCreateDiscount(validPercentage);
  const amount = validateCreateDiscount({ ...validPercentage, type: 'AMOUNT_OFF', value: '5.50' });

  assert.equal(percentage.success, true);
  assert.equal(amount.success, true);
  if (percentage.success) {
    assert.equal(percentage.data.expiryDate.toISOString(), '2999-12-31T00:00:00.000Z');
  }
});

test('validateCreateDiscount rejects blank fields', () => {
  const result = validateCreateDiscount({ code: '', type: '', value: '', expiryDate: '' });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(Object.keys(result.errors.fieldErrors).sort(), ['code', 'type']);
  }
});

test('validateCreateDiscount enforces value rules per discount type', () => {
  const invalid = [
    { type: 'PERCENTAGE', value: '101' },
    { type: 'PERCENTAGE', value: '10.5' },
    { type: 'PERCENTAGE', value: '-1' },
    { type: 'PERCENTAGE', value: '' },
    { type: 'AMOUNT_OFF', value: '0' },
    { type: 'AMOUNT_OFF', value: '-5' },
    { type: 'AMOUNT_OFF', value: '5.123' },
    { type: 'AMOUNT_OFF', value: 'abc' },
  ];

  for (const overrides of invalid) {
    const result = validateCreateDiscount({ ...validPercentage, ...overrides });
    assert.equal(result.success, false, JSON.stringify(overrides));
  }
  assert.equal(validateCreateDiscount({ ...validPercentage, value: '0' }).success, true);
  assert.equal(validateCreateDiscount({ ...validPercentage, value: '100' }).success, true);
});

test('validateCreateDiscount rejects bad codes and expiry dates', () => {
  for (const overrides of [
    { code: 'ab' },
    { code: 'has space' },
    { expiryDate: '2000-01-01' },
    { expiryDate: '2999-02-30' },
    { expiryDate: '31/12/2999' },
  ]) {
    assert.equal(
      validateCreateDiscount({ ...validPercentage, ...overrides }).success,
      false,
      JSON.stringify(overrides),
    );
  }
});
