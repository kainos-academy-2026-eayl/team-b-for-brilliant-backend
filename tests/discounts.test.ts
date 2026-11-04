import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';
import { discountServices } from '../src/controllers/discounts';
import { HttpError } from '../src/errors/httpError';
import { Prisma } from '../src/generated/prisma/client';
import { createAuthenticateCustomer } from '../src/middleware/authenticateCustomer';
<<<<<<< HEAD
import { validateActivateDiscount, validateCreateDiscount } from '../src/schemas/discount';
import { deactivateDiscount, getDiscounts } from '../src/services/discounts';
=======
import { requireAdmin } from '../src/middleware/requireAdmin';
import { validateCreateDiscount } from '../src/schemas/discount';
import { deleteDiscount, getDiscounts } from '../src/services/discounts';
>>>>>>> main
import { createSession } from '../src/services/sessions';

const savedDiscount = {
  discountID: 'discount-1',
  code: 'SUMMER10',
  type: 'PERCENTAGE' as const,
  value: new Prisma.Decimal('10'),
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  expiryDate: new Date('2026-12-31T00:00:00.000Z'),
};

<<<<<<< HEAD
const savedDto = {
  discountID: 'discount-1',
  code: 'SUMMER10',
  type: 'PERCENTAGE' as const,
  value: '10.00',
  expiryDate: '2026-12-31T00:00:00.000Z',
};

=======
>>>>>>> main
function createTestApp(services = discountServices) {
  return createApp(
    undefined,
    undefined,
    undefined,
    undefined,
    createAuthenticateCustomer(),
    services,
  );
}

test('getDiscounts maps stored discounts to DTOs', async () => {
  const result = await getDiscounts({
    findAllDiscounts: async () => [savedDiscount],
<<<<<<< HEAD
    createDiscountRecord: async () => null,
    updateDiscountExpiry: async () => null,
=======
    deleteDiscountByID: async () => ({ count: 0 }),
    createDiscountRecord: async () => null,
>>>>>>> main
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

<<<<<<< HEAD
test('GET /discounts returns the list for a logged-in user', async () => {
=======
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
>>>>>>> main
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
<<<<<<< HEAD
    createDiscount: async () => {
      throw new Error('not used');
    },
    deactivateDiscount: async () => {
      throw new Error('not used');
    },
    activateDiscount: async () => {
      throw new Error('not used');
    },
  });
  const token = createSession('customer-1');
=======
    deleteDiscount: async () => {},
    createDiscount: async () => {
      throw new Error('not used');
    },
  });
  const token = createSession('admin-1', Date.now(), 1);
>>>>>>> main
  const response = await request(app)
    .get('/discounts')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(response.body.discounts[0].code, 'SUMMER10');
  assert.equal(response.body.discounts[0].type, 'PERCENTAGE');
  assert.equal(response.body.discounts[0].value, '10.00');
});

<<<<<<< HEAD
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

test('deactivateDiscount sets the expiry date to today and throws 404 when missing', async () => {
  let saved: Date | undefined;
  const repo = {
    findAllDiscounts: async () => [],
    createDiscountRecord: async () => null,
    updateDiscountExpiry: async (id: string, expiryDate: Date) => {
      if (id !== 'discount-1') {
        return null;
      }
      saved = expiryDate;
      return { ...savedDiscount, expiryDate };
    },
  };

  const result = await deactivateDiscount('discount-1', repo);

  assert.equal(saved?.toISOString(), `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  assert.equal(result.expiryDate, saved?.toISOString());
  await assert.rejects(
    deactivateDiscount('missing', repo),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});

test('validateActivateDiscount requires a valid, non-past date', () => {
  const valid = validateActivateDiscount({ expiryDate: futureDate });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.expiryDate.toISOString(), '2999-12-31T00:00:00.000Z');
  }
  for (const expiryDate of ['', '2000-01-01', '2999-02-30', '31/12/2999']) {
    assert.equal(validateActivateDiscount({ expiryDate }).success, false, expiryDate);
  }
});

test('POST /discounts/:id/deactivate and /activate work for logged-in users', async () => {
=======
test('DELETE /discounts/:discountID returns 204, 404 and refuses non-admins', async () => {
>>>>>>> main
  const app = createTestApp({
    getDiscounts: async () => ({ discounts: [] }),
    createDiscount: async () => {
      throw new Error('not used');
    },
    deactivateDiscount: async (discountID) => {
      if (discountID !== 'discount-1') {
        throw new HttpError(404, 'Discount not found');
      }
      return { ...savedDto, expiryDate: '2026-11-03T00:00:00.000Z' };
    },
<<<<<<< HEAD
    activateDiscount: async (_id, expiryDate) => ({
      ...savedDto,
      expiryDate: expiryDate.toISOString(),
    }),
  });
  const token = createSession('customer-1');
=======
    createDiscount: async () => {
      throw new Error('not used');
    },
  });
  const adminToken = createSession('admin-1', Date.now(), 1);
  const customerToken = createSession('customer-1');
>>>>>>> main

  const deactivated = await request(app)
    .post('/discounts/discount-1/deactivate')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.equal(deactivated.body.expiryDate, '2026-11-03T00:00:00.000Z');
  await request(app)
    .post('/discounts/other/deactivate')
    .set('Authorization', `Bearer ${token}`)
    .expect(404);

  const activated = await request(app)
    .post('/discounts/discount-1/activate')
    .set('Authorization', `Bearer ${token}`)
    .send({ expiryDate: futureDate })
    .expect(200);
  assert.equal(activated.body.expiryDate, '2999-12-31T00:00:00.000Z');
  await request(app)
    .post('/discounts/discount-1/activate')
    .set('Authorization', `Bearer ${token}`)
    .send({ expiryDate: '2000-01-01' })
    .expect(400);
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
