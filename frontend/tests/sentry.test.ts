import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeEvent } from "../src/lib/sentry.ts";

test("Sentry event privacy filter removes request, user, breadcrumbs, extra and contexts", () => {
  const safe = sanitizeEvent({
    type: undefined,
    message: "calculator failed",
    request: { url: "https://example.invalid/private" },
    user: { email: "private@example.invalid" },
    breadcrumbs: [{ message: "typed a password" }],
    extra: { savedPlan: "private" },
    contexts: { browser: { name: "browser" } },
  });
  assert.equal(safe.message, "calculator failed");
  assert.equal(safe.request, undefined);
  assert.equal(safe.user, undefined);
  assert.equal(safe.breadcrumbs, undefined);
  assert.equal(safe.extra, undefined);
  assert.equal(safe.contexts, undefined);
});
