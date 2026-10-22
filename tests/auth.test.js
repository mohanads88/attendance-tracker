// Tests for the access-password login and the protected analysis endpoint.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.ACCESS_PASSWORD = "test-pass";
const { default: auth } = await import("../api/auth.js");
const { default: analyze } = await import("../api/analyze.js");
const { verifyToken, issueToken } = await import("../lib/auth.js");

function call(handler, { body = {}, headers = {} } = {}) {
  return new Promise((resolve) => {
    const res = {
      code: 200,
      status(c) { this.code = c; return this; },
      json(d) { resolve({ code: this.code, data: d }); },
    };
    handler({ method: "POST", body, headers }, res);
  });
}

test("wrong password is rejected", async () => {
  const r = await call(auth, { body: { password: "nope" } });
  assert.equal(r.code, 401);
  assert.equal(r.data.token, undefined);
});

test("right password returns a valid token", async () => {
  const r = await call(auth, { body: { password: "test-pass" } });
  assert.equal(r.code, 200);
  assert.ok(verifyToken(r.data.token));
});

test("analysis is refused without a token", async () => {
  const r = await call(analyze, { body: { images: [{ data: "x" }] } });
  assert.equal(r.code, 401);
});

test("analysis is refused with a forged token", async () => {
  const exp = Date.now() + 3600e3;
  const r = await call(analyze, { body: {}, headers: { authorization: `Bearer ${exp}.forged` } });
  assert.equal(r.code, 401);
});

test("tokens stop working when the password changes", () => {
  const t = issueToken();
  process.env.ACCESS_PASSWORD = "new-pass";
  assert.equal(verifyToken(t), false);
  process.env.ACCESS_PASSWORD = "test-pass";
  assert.equal(verifyToken(t), true);
});
