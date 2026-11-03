import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Express, RequestHandler } from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import type { OrderRecord } from '../src/dtos/orders';
import { getOrders, type OrdersRepository, toOrderDto } from '../src/services/orders';

const record: OrderRecord = {
  orderID: 'order-1',
  createdAt: new Date('2026-10-20T09:30:00.000Z'),
  orderItems: [
    { productID: 'p1', quantity: 2, unitPrice: '4.5', product: { name: 'Lip Balm' } },
    { productID: 'p2', quantity: 1, unitPrice: '12.99', product: { name: 'Face Cream' } },
  ],
};

test('toOrderDto formats prices and totals from the stored order', () => {
  const order = toOrderDto(record);

  assert.equal(order.orderID, 'order-1');
  assert.equal(order.placedAt, '2026-10-20T09:30:00.000Z');
  assert.deepEqual(order.items[0], {
    productID: 'p1',
    productName: 'Lip Balm',
    quantity: 2,
    unitPrice: '4.50',
    lineTotal: '9.00',
  });
  assert.equal(order.total, '21.99');
});

test('getOrders asks the repository for the signed-in customer only', async () => {
  const asked: string[] = [];
  const repo: OrdersRepository = {
    findOrdersForCustomer: async (customerID) => {
      asked.push(customerID);
      return [record];
    },
  };

  const orders = await getOrders('customer-1', repo);

  assert.deepEqual(asked, ['customer-1']);
  assert.equal(orders.length, 1);
});

test('getOrders returns an empty list when the customer has no orders', async () => {
  const repo: OrdersRepository = { findOrdersForCustomer: async () => [] };

  assert.deepEqual(await getOrders('customer-1', repo), []);
});

function appFor(customerID?: string): Express {
  const fakeAuthenticate: RequestHandler = (_req, res, next) => {
    if (!customerID) {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }
    res.locals.customerID = customerID;
    next();
  };

  return createApp(undefined, undefined, undefined, undefined, fakeAuthenticate);
}

test('orders route rejects requests that are not signed in', async () => {
  await request(appFor()).get('/orders').expect(401);
});
