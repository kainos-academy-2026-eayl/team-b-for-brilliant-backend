import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateUpdateProfile } from '../src/schemas/profile';

const validProfile = {
  firstname: 'Customer',
  surname: 'One',
  addressLine1: '4-6 Upper Crescent',
  addressLine2: 'Belfast',
  postcode: 'BT7 1NT',
};

test('a complete profile is accepted', () => {
  const result = validateUpdateProfile(validProfile);

  assert.equal(result.success, true);
});

test('required fields cannot be missing or blank', () => {
  for (const field of ['firstname', 'surname', 'addressLine1', 'postcode']) {
    assert.equal(validateUpdateProfile({ ...validProfile, [field]: '   ' }).success, false);
    assert.equal(validateUpdateProfile({ ...validProfile, [field]: undefined }).success, false);
  }
});

test('address line 2 is optional and blank becomes null', () => {
  for (const addressLine2 of [undefined, null, '', '   ']) {
    const result = validateUpdateProfile({ ...validProfile, addressLine2 });

    assert.equal(result.success, true);
    assert.equal(result.success && result.data.addressLine2, null);
  }
});

test('postcodes are checked and stored in one tidy format', () => {
  for (const postcode of ['bt71nt', ' BT7  1NT ', 'bt7 1nt']) {
    const result = validateUpdateProfile({ ...validProfile, postcode });

    assert.equal(result.success && result.data.postcode, 'BT7 1NT');
  }

  assert.equal(validateUpdateProfile({ ...validProfile, postcode: 'SW1A 1AA' }).success, true);

  for (const postcode of ['12345', 'hello', 'BT7', 'BT7 1NTX', 123]) {
    assert.equal(validateUpdateProfile({ ...validProfile, postcode }).success, false);
  }
});

test('over-long values are rejected', () => {
  assert.equal(
    validateUpdateProfile({ ...validProfile, firstname: 'a'.repeat(51) }).success,
    false,
  );
  assert.equal(
    validateUpdateProfile({ ...validProfile, addressLine1: 'a'.repeat(101) }).success,
    false,
  );
});

test('fields that are not part of the profile are ignored, not saved', () => {
  const result = validateUpdateProfile({ ...validProfile, email: 'x@y.com', userID: 'other' });

  assert.equal(result.success, true);
  assert.deepEqual(Object.keys(result.success ? result.data : {}).sort(), [
    'addressLine1',
    'addressLine2',
    'firstname',
    'postcode',
    'surname',
  ]);
});
