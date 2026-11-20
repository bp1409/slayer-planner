import assert from "node:assert/strict";
import test from "node:test";
import { redactSensitiveText, sanitizeEvent } from "../src/lib/sentry.ts";

test("Sentry privacy redaction removes common secrets and paths", () => {
  const text = redactSensitiveText("token=abc123 email@example.com https://example.test C:\\Users\\Ben\\plans.json");
  assert.equal(text.includes("abc123"), false);
  assert.equal(text.includes("email@example.com"), false);
  assert.equal(text.includes("https://example.test"), false);
  assert.equal(text.includes("C:\\Users\\Ben"), false);
});

test("Sentry event privacy filter removes request, user, breadcrumbs, extra and contexts", () => {
  const safe = sanitizeEvent({
    type: undefined,
    message: "token=abc123 calculator failed",
    request: { url: "https://example.invalid/private" },
    user: { email: "private@example.invalid" },
    breadcrumbs: [{ message: "typed a password" }],
    extra: { savedPlan: "private" },
    contexts: { browser: { name: "browser" } },
    exception: { values: [{ value: "secret=abc123", stacktrace: { frames: [{ filename: "C:\\Users\\Ben\\app.ts", function: "loadToken" }] } }] },
  });
  assert.equal(safe.message, "token=[redacted] calculator failed");
  assert.equal(safe.request, undefined);
  assert.equal(safe.user, undefined);
  assert.equal(safe.breadcrumbs, undefined);
  assert.equal(safe.extra, undefined);
  assert.equal(safe.contexts, undefined);
  assert.equal(safe.exception?.values?.[0]?.value, "secret=[redacted]");
  assert.equal(safe.exception?.values?.[0]?.stacktrace?.frames?.[0]?.filename?.includes("C:\\Users"), false);
});
