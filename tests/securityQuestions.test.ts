import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createAccountDetailsRouter } from '../src/controllers/accountDetails';
import { HttpError } from '../src/errors/httpError';
import { createAuthenticateCustomer } from '../src/middleware/authenticateCustomer';
import { type AccountDetails, accountDetailsSchema } from '../src/schemas/accountDetails';
import { saveCustomerDetails } from '../src/services/accountDetails';
import { comparePasswords } from '../src/services/password';
import { createSession, endSession } from '../src/services/sessions';

test('security question choices require authentication and return the stored IDs and text', async () => {
  const questions = [{ questionID: 'q1', question: 'What is your favourite colour?' }];
  const app = express();
  let loads = 0;
  app.use(
    '/account',
    createAuthenticateCustomer(),
    createAccountDetailsRouter(
      async () => {
        assert.fail('Reading questions must not save details');
      },
      async () => {
        loads++;
        return questions;
      },
    ),
  );
  await request(app).get('/account/security-questions').expect(401);
  assert.equal(loads, 0);
  const token = createSession('customer-1');
  try {
    const response = await request(app)
      .get('/account/security-questions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.deepEqual(response.body, { questions });
    assert.equal(loads, 1);
  } finally {
    endSession(token);
  }
});

test('answered security questions store the selected ID and a verifiable hash, not plaintext', async () => {
  const captured: AccountDetails[] = [];
  const input = accountDetailsSchema.parse({
    firstname: 'Jane',
    securityQuestionID: 'q1',
    securityAnswer: ' Blue ',
  });
  await saveCustomerDetails(
    'customer-1',
    input,
    async (id, details) => {
      assert.equal(id, 'customer-1');
      captured.push(details);
      return { count: 1 };
    },
    async (id) => {
      assert.equal(id, 'q1');
      return { questionID: id };
    },
  );
  const saved = captured[0];
  assert.ok(saved);
  assert.equal(saved.securityQuestionID, 'q1');
  assert.ok(saved.securityAnswer);
  assert.notEqual(saved.securityAnswer, 'Blue');
  assert.equal(await comparePasswords('Blue', saved.securityAnswer), true);
});

test('blank answers leave both security fields untouched even when a question was selected', async () => {
  for (const securityAnswer of ['', '   ', undefined]) {
    const input = accountDetailsSchema.parse({ securityQuestionID: 'q1', securityAnswer });
    await saveCustomerDetails(
      'customer-1',
      input,
      async (_id, details) => {
        assert.equal(Object.hasOwn(details, 'securityQuestionID'), false);
        assert.equal(Object.hasOwn(details, 'securityAnswer'), false);
        return { count: 1 };
      },
      async () => {
        assert.fail('Blank answers must not query or save a question');
      },
    );
  }
});

test('an answer requires an existing question and cannot partially save the profile', async () => {
  assert.equal(accountDetailsSchema.safeParse({ securityAnswer: 'Blue' }).success, false);
  assert.equal(
    accountDetailsSchema.safeParse({ securityQuestionID: 'q1', securityAnswer: 'x'.repeat(1025) })
      .success,
    false,
  );
  const input = accountDetailsSchema.parse({
    firstname: 'Jane',
    securityQuestionID: 'missing',
    securityAnswer: 'Blue',
  });
  await assert.rejects(
    saveCustomerDetails(
      'customer-1',
      input,
      async () => {
        assert.fail('Invalid questions must not save any fields');
      },
      async () => null,
    ),
    (error: unknown) => error instanceof HttpError && error.status === 400,
  );
});
