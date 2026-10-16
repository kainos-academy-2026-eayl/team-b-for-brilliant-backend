import { describe, test, before, after } from "node:test";
import assert from "node:assert";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import app from "../Login_Backend";

let server: Server;
let baseUrl: string;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

function login(body: unknown): Promise<globalThis.Response> {
  return fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /login", () => {
  describe("valid credentials", () => {
    test("returns 200 and a success message for alice", async () => {
      const res = await login({ email: "alice@example.com", password: "password123" });

      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(await res.json(), { message: "Login successful" });
    });

    test("returns 200 for bob", async () => {
      const res = await login({ email: "bob@example.com", password: "letmein" });

      assert.strictEqual(res.status, 200);
    });
  });

  describe("invalid credentials", () => {
    test("returns 401 for a wrong password", async () => {
      const res = await login({ email: "alice@example.com", password: "wrong" });

      assert.strictEqual(res.status, 401);
      assert.deepStrictEqual(await res.json(), { error: "Invalid email or password" });
    });

    test("returns 401 for an unknown email", async () => {
      const res = await login({ email: "charlie@example.com", password: "password123" });

      assert.strictEqual(res.status, 401);
    });

    test("returns 401 when using another user's password", async () => {
      const res = await login({ email: "alice@example.com", password: "letmein" });

      assert.strictEqual(res.status, 401);
    });
  });

  describe("missing fields", () => {
    const cases = [
      { name: "email is missing", body: { password: "password123" } },
      { name: "password is missing", body: { email: "alice@example.com" } },
      { name: "both are missing", body: {} },
      { name: "email is empty", body: { email: "", password: "password123" } },
      { name: "password is empty", body: { email: "alice@example.com", password: "" } },
    ];

    for (const { name, body } of cases) {
      test(`returns 400 when ${name}`, async () => {
        const res = await login(body);

        assert.strictEqual(res.status, 400);
        assert.deepStrictEqual(await res.json(), { error: "Email and password are required" });
      });
    }

    test("returns 400 when no body is sent", async () => {
      const res = await fetch(`${baseUrl}/login`, { method: "POST" });

      assert.strictEqual(res.status, 400);
    });
  });

  describe("email format validation", () => {
    const invalidEmails = [
      "alice",
      "alice@",
      "@example.com",
      "alice@example",
      "alice example@example.com",
      "alice@@example.com",
    ];

    for (const email of invalidEmails) {
      test(`returns 400 for "${email}"`, async () => {
        const res = await login({ email, password: "password123" });

        assert.strictEqual(res.status, 400);
        assert.deepStrictEqual(await res.json(), { error: "Email address is not valid" });
      });
    }

    test("accepts a well-formed email that isn't registered (401, not 400)", async () => {
      const res = await login({ email: "first.last+tag@sub.example.co.uk", password: "x" });

      assert.strictEqual(res.status, 401);
    });
  });
});
