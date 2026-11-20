import assert from "node:assert/strict";
import test from "node:test";
import { redactSensitiveText, sanitizeEvent } from "../src/lib/sentry.ts";

test("Sentry privacy redaction removes common secrets and paths", () => {
  const text = redactSensitiveText("token=abc123 email@example.com https://example.test C:\\Users\\Ben\\plans.json Steps / expected");
  assert.equal(text.includes("abc123"), false);
  assert.equal(text.includes("email@example.com"), false);
  assert.equal(text.includes("https://example.test"), false);
  assert.equal(text.includes("C:\\Users\\Ben"), false);
  assert.equal(text.includes("Steps / expected"), true);
});

test("Sentry event privacy filter removes sensitive event fields and stack context", () => {
  const safe = sanitizeEvent({
    type: undefined,
    message: "token=abc123 calculator failed",
    request: { url: "https://example.invalid/private" },
    user: { email: "private@example.invalid" },
    breadcrumbs: [{ message: "typed a password" }],
    extra: { savedPlan: "private" },
    contexts: { browser: { name: "browser" } },
    tags: { account: "private" },
    modules: { private: "module" },
    transaction: "private transaction",
    fingerprint: ["private"],
    sdk: { name: "sdk", version: "1" },
    release: "private-release",
    environment: "private-environment",
    exception: { values: [{ value: "secret=abc123", stacktrace: { frames: [{ filename: "C:\\Users\\Ben\\app.ts", function: "loadToken" }] } }] },
  });
  assert.equal(safe.message, "token=[redacted] calculator failed");
  assert.equal(safe.request, undefined);
  assert.equal(safe.user, undefined);
  assert.equal(safe.breadcrumbs, undefined);
  assert.equal(safe.extra, undefined);
  assert.equal(safe.contexts, undefined);
  assert.equal(safe.tags, undefined);
  assert.equal(safe.modules, undefined);
  assert.equal(safe.transaction, undefined);
  assert.equal(safe.fingerprint, undefined);
  assert.equal(safe.sdk, undefined);
  assert.equal(safe.release, undefined);
  assert.equal(safe.environment, undefined);
  assert.equal(safe.exception?.values?.[0]?.value, "secret=[redacted]");
  assert.equal(safe.exception?.values?.[0]?.stacktrace?.frames?.[0]?.filename?.includes("C:\\Users"), false);
  assert.equal(safe.exception?.values?.[0]?.stacktrace?.frames?.[0]?.module, undefined);
});
