import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HttpError } from '../src/errors/httpError';
import type { BasketItemWithProduct, LockedBasketQueries } from '../src/repositories/basket';
import {
  addToBasket,
  type BasketRepository,
  getBasket,
  removeFromBasket,
  setBasketItemQuantity,
} from '../src/services/basket';

function createFakeRepo(stock: number, quantityInBasket?: number): BasketRepository {
  let basketQuantity = quantityInBasket;
  const product = {
    productID: 'product-1',
    name: 'Mug',
    description: null,
    quantity: stock,
    draft: false,
    visible: true,
    weight: 1,
    salesNo: 0,
    deletedAt: null,
    salesNo: 0,
  };

  const toItem = (quantity: number): BasketItemWithProduct => ({
    basketID: 'item-1',
    userID: 'customer-1',
    productID: 'product-1',
    quantity,
    createdAt: new Date(),
    updatedAt: new Date(),
    product,
  });

  const locked: LockedBasketQueries = {
    findProductForBasket: async () => product,
    findBasketItem: async () => (basketQuantity === undefined ? null : toItem(basketQuantity)),
    saveBasketItemQuantity: async (_customerID, _productID, quantity) => {
      basketQuantity = quantity;
      return toItem(quantity);
    },
    deleteBasketItem: async () => {
      const count = basketQuantity === undefined ? 0 : 1;
      basketQuantity = undefined;
      return { count };
    },
  };

  return {
    findBasketItems: async () => (basketQuantity === undefined ? [] : [toItem(basketQuantity)]),
    withCustomerLock: (_customerID, work) => work(locked),
  };
}

test('basket shows low stock at 10 or fewer, but not above 10', async () => {
  const low = await getBasket('customer-1', createFakeRepo(10, 2));
  const normal = await getBasket('customer-1', createFakeRepo(11, 2));

  assert.equal(low.items[0]?.lowStock, true);
  assert.equal(normal.items[0]?.lowStock, false);
});

test('sold out is not reported as low stock', async () => {
  const soldOut = await getBasket('customer-1', createFakeRepo(0, 2));
  assert.equal(soldOut.items[0]?.lowStock, false);
  assert.equal(soldOut.items[0]?.isQuantityAvailable, false);
});

test('adding to basket is rejected when the total would exceed stock', async () => {
  await assert.rejects(
    addToBasket('customer-1', 'product-1', 4, createFakeRepo(5, 2)),
    (error) => error instanceof HttpError && error.status === 409,
  );
});

test('adding to an existing basket item adds to its quantity', async () => {
  const item = await addToBasket('customer-1', 'product-1', 2, createFakeRepo(5, 2));
  assert.equal(item.quantityInBasket, 4);
});

test('setting quantity to exactly the stock level is allowed', async () => {
  const item = await setBasketItemQuantity('customer-1', 'product-1', 5, createFakeRepo(5, 2));
  assert.ok(item, 'Expected an updated basket item');
  assert.equal(item.quantityInBasket, 5);
});

test('setting quantity to 0 removes the item from the basket', async () => {
  const repo = createFakeRepo(5, 2);
  const result = await setBasketItemQuantity('customer-1', 'product-1', 0, repo);

  assert.equal(result, null);
  assert.deepEqual((await getBasket('customer-1', repo)).items, []);
});

test('setting quantity to 0 for an item not in the basket returns not found', async () => {
  await assert.rejects(
    setBasketItemQuantity('customer-1', 'product-1', 0, createFakeRepo(5)),
    (error) => error instanceof HttpError && error.status === 404,
  );
});

test('setting quantity above stock is rejected', async () => {
  await assert.rejects(
    setBasketItemQuantity('customer-1', 'product-1', 6, createFakeRepo(5, 2)),
    (error) => error instanceof HttpError && error.status === 409,
  );
});

test('removing a product that is not in the basket returns not found', async () => {
  await assert.rejects(
    removeFromBasket('customer-1', 'product-1', createFakeRepo(5)),
    (error) => error instanceof HttpError && error.status === 404,
  );
});
