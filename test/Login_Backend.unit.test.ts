import { describe, test, beforeEach, mock } from "node:test";
import assert from "node:assert";
import {
  LOCKOUT_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  clearFailedAttempts,
  createSession,
  endSession,
  findUser,
  getBearerToken,
  isLockedOut,
  isValidEmail,
  recordFailedAttempt,
  resetLoginAttempts,
  resetSessions,
} from "../Login_Backend";

beforeEach(() => {
  resetLoginAttempts();
  resetSessions();
});

function failTimes(email: string, count: number): void {
  for (let i = 0; i < count; i++) {
    recordFailedAttempt(email);
  }
}

describe("isValidEmail", () => {
  for (const email of ["alice@example.com", "first.last+tag@sub.example.co.uk"]) {
    test(`returns true for "${email}"`, () => {
      assert.strictEqual(isValidEmail(email), true);
    });
  }

  for (const email of ["", "alice", "alice@", "@example.com", "alice@example", "a b@example.com", "a@@example.com"]) {
    test(`returns false for "${email}"`, () => {
      assert.strictEqual(isValidEmail(email), false);
    });
  }
});

describe("findUser", () => {
  test("returns the user when email and password match", () => {
    const user = findUser("alice@example.com", "password123");

    assert.deepStrictEqual(user, { email: "alice@example.com", password: "password123" });
  });

  test("returns undefined for a wrong password", () => {
    assert.strictEqual(findUser("alice@example.com", "wrong"), undefined);
  });

  test("returns undefined for an unknown email", () => {
    assert.strictEqual(findUser("nobody@example.com", "password123"), undefined);
  });

  test("returns undefined when the password belongs to a different user", () => {
    assert.strictEqual(findUser("alice@example.com", "letmein"), undefined);
  });
});

describe("getBearerToken", () => {
  test("returns the token from a valid header", () => {
    assert.strictEqual(getBearerToken("Bearer abc123"), "abc123");
  });

  test("trims extra spaces around the token", () => {
    assert.strictEqual(getBearerToken("Bearer   abc123  "), "abc123");
  });

  test("returns null when the header is missing", () => {
    assert.strictEqual(getBearerToken(undefined), null);
  });

  test("returns null when the 'Bearer ' prefix is missing", () => {
    assert.strictEqual(getBearerToken("abc123"), null);
  });

  test("returns null when the prefix has the wrong case", () => {
    assert.strictEqual(getBearerToken("bearer abc123"), null);
  });

  test("returns null when there is no token after the prefix", () => {
    assert.strictEqual(getBearerToken("Bearer    "), null);
  });
});

describe("createSession and endSession", () => {
  test("createSession returns a non-empty token", () => {
    const token = createSession("alice@example.com");

    assert.strictEqual(typeof token, "string");
    assert.ok(token.length > 0);
  });

  test("createSession returns a different token each time", () => {
    assert.notStrictEqual(createSession("alice@example.com"), createSession("alice@example.com"));
  });

  test("endSession returns true for an active session", () => {
    const token = createSession("alice@example.com");

    assert.strictEqual(endSession(token), true);
  });

  test("endSession returns false the second time, because the session is gone", () => {
    const token = createSession("alice@example.com");
    endSession(token);

    assert.strictEqual(endSession(token), false);
  });

  test("endSession returns false for a token that was never created", () => {
    assert.strictEqual(endSession("made-up-token"), false);
  });

  test("ending one session leaves other sessions active", () => {
    const aliceToken = createSession("alice@example.com");
    const bobToken = createSession("bob@example.com");
    endSession(aliceToken);

    assert.strictEqual(endSession(bobToken), true);
  });
});

describe("lockout tracking", () => {
  const email = "alice@example.com";

  test("an email with no failed attempts is not locked", () => {
    assert.strictEqual(isLockedOut(email), false);
  });

  test("is not locked after one fewer than the maximum failures", () => {
    failTimes(email, MAX_FAILED_ATTEMPTS - 1);

    assert.strictEqual(isLockedOut(email), false);
  });

  test("is locked after the maximum number of failures", () => {
    failTimes(email, MAX_FAILED_ATTEMPTS);

    assert.strictEqual(isLockedOut(email), true);
  });

  test("locking one email does not lock another", () => {
    failTimes(email, MAX_FAILED_ATTEMPTS);

    assert.strictEqual(isLockedOut("bob@example.com"), false);
  });

  test("clearFailedAttempts resets the count", () => {
    failTimes(email, MAX_FAILED_ATTEMPTS - 1);
    clearFailedAttempts(email);
    failTimes(email, MAX_FAILED_ATTEMPTS - 1);

    assert.strictEqual(isLockedOut(email), false);
  });

  test("is still locked just before the lockout period ends", (t) => {
    t.after(() => mock.timers.reset());
    mock.timers.enable({ apis: ["Date"], now: 0 });
    failTimes(email, MAX_FAILED_ATTEMPTS);

    mock.timers.tick(LOCKOUT_DURATION_MS - 1);

    assert.strictEqual(isLockedOut(email), true);
  });

  test("is unlocked once the lockout period has passed, with the count reset", (t) => {
    t.after(() => mock.timers.reset());
    mock.timers.enable({ apis: ["Date"], now: 0 });
    failTimes(email, MAX_FAILED_ATTEMPTS);

    mock.timers.tick(LOCKOUT_DURATION_MS);

    assert.strictEqual(isLockedOut(email), false);
    recordFailedAttempt(email);
    assert.strictEqual(isLockedOut(email), false);
  });
});
