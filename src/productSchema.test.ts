import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type CreateProduct, validateCreateProduct } from './schemas/product';

const validProduct = { name: 'Example product', quantity: 0, weight: 0 };

test('product input validates required fields and trims the name', () => {
  const result = validateCreateProduct({ ...validProduct, name: '  Example product  ' });

  assert.equal(result.success, true);
  if (!result.success) {
    assert.fail('Expected valid product input');
  }
  const product: CreateProduct = result.data;
  assert.deepEqual(product, validProduct);
});

test('product input accepts optional description and boolean flags', () => {
  for (const description of ['Description', null]) {
    const product = { ...validProduct, description, draft: false, visible: true };
    assert.deepEqual(validateCreateProduct(product), { success: true, data: product });
  }
});

test('product input reports missing required fields', () => {
  const result = validateCreateProduct({});
  assert.equal(result.success, false);
  if (result.success) {
    assert.fail('Expected invalid product input');
  }
  assert.deepEqual(Object.keys(result.errors.fieldErrors).sort(), ['name', 'quantity', 'weight']);
});

test('product input rejects invalid field values without coercion', () => {
  const invalidFields = [
    { name: '' },
    { name: '   ' },
    { name: 123 },
    { quantity: -1 },
    { quantity: 1.5 },
    { quantity: 2_147_483_648 },
    { quantity: '5' },
    { weight: -0.1 },
    { weight: Number.NaN },
    { weight: Number.POSITIVE_INFINITY },
    { weight: '2' },
    { description: 123 },
    { draft: 'false' },
    { visible: 1 },
  ];

  for (const fields of invalidFields) {
    const result = validateCreateProduct({ ...validProduct, ...fields });
    assert.equal(result.success, false, `Expected rejection for ${Object.keys(fields).join(', ')}`);
    if (result.success) {
      assert.fail('Expected invalid product input');
    }
    const field = Object.keys(fields)[0];
    assert.ok(Object.keys(result.errors.fieldErrors).includes(field ?? ''));
  }
});

test('product input preserves form-level errors for invalid top-level input', () => {
  for (const input of [null, undefined, [], 'product', 42]) {
    const result = validateCreateProduct(input);
    assert.equal(result.success, false);
    if (result.success) {
      assert.fail('Expected invalid product input');
    }
    assert.ok(result.errors.formErrors.length > 0);
  }
});

test('product input strips generated fields, images and unknown properties', () => {
  const result = validateCreateProduct({
    ...validProduct,
    productID: 'not-client-controlled',
    deletedAt: '2026-01-01',
    productImages: [],
    unexpected: true,
  });

  assert.deepEqual(result, { success: true, data: validProduct });
});
