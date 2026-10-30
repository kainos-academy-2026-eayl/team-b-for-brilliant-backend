import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Express, RequestHandler } from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import type { ProfileDto } from '../src/dtos/profile';
import { HttpError } from '../src/errors/httpError';
import { getProfile, type ProfileRepository, updateProfile } from '../src/services/profile';

const savedProfile: ProfileDto = {
  email: 'customer@gmail.com',
  firstname: 'Customer',
  surname: 'One',
  addressLine1: '4-6 Upper Crescent',
  addressLine2: 'Belfast',
  postcode: 'BT7 1NT',
};

const input = {
  firstname: 'Customer',
  surname: 'One',
  addressLine1: '4-6 Upper Crescent',
  addressLine2: null,
  postcode: 'BT7 1NT',
};

function createFakeRepo(profile: ProfileDto | null): ProfileRepository & { saved: unknown[] } {
  const saved: unknown[] = [];

  return {
    saved,
    findProfile: async () => profile,
    saveProfile: async (customerID, data) => {
      saved.push({ customerID, data });
      return profile ? { ...profile, ...data } : null;
    },
  };
}

test('getProfile returns the stored profile', async () => {
  const profile = await getProfile('customer-1', createFakeRepo(savedProfile));

  assert.deepEqual(profile, savedProfile);
});

test('getProfile gives a 404 when the customer does not exist', async () => {
  await assert.rejects(
    getProfile('missing', createFakeRepo(null)),
    (error) => error instanceof HttpError && error.status === 404,
  );
});

test('updateProfile saves against the signed-in customer and returns the result', async () => {
  const repo = createFakeRepo(savedProfile);
  const profile = await updateProfile('customer-1', input, repo);

  assert.equal(profile.addressLine2, null);
  assert.deepEqual(repo.saved, [{ customerID: 'customer-1', data: input }]);
});

test('updateProfile gives a 404 when the customer does not exist', async () => {
  await assert.rejects(
    updateProfile('missing', input, createFakeRepo(null)),
    (error) => error instanceof HttpError && error.status === 404,
  );
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

test('profile routes reject requests that are not signed in', async () => {
  await request(appFor()).get('/profile').expect(401);
  await request(appFor()).put('/profile').send(input).expect(401);
});

test('an invalid profile is rejected before anything is saved', async () => {
  const response = await request(appFor('customer-1'))
    .put('/profile')
    .send({ ...input, postcode: 'nonsense' })
    .expect(400);

  assert.equal(response.body.error, 'Invalid profile');
});
