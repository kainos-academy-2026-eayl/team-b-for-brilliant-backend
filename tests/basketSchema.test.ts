import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateAddBasketItem, validateUpdateBasketItem } from '../src/schemas/basket';

test('basket quantity must be a whole number of at least one when adding', () => {
  for (const quantity of [0, -1, 1.5, '2', null]) {
    assert.equal(validateAddBasketItem({ productID: 'product-1', quantity }).success, false);
  }

  assert.equal(validateAddBasketItem({ productID: 'product-1', quantity: 1 }).success, true);
});

test('editing a quantity allows 0 (remove) but not negatives, decimals or non-numbers', () => {
  for (const quantity of [-1, 1.5, '2', null]) {
    assert.equal(validateUpdateBasketItem({ quantity }).success, false);
  }

  assert.equal(validateUpdateBasketItem({ quantity: 0 }).success, true);
  assert.equal(validateUpdateBasketItem({ quantity: 1 }).success, true);
});

test('adding to basket requires a product ID', () => {
  assert.equal(validateAddBasketItem({ productID: '   ', quantity: 1 }).success, false);
});
