import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("./AdminPortal.jsx", import.meta.url), "utf8");

test("merchant onboarding defaults demo customer creation off and explains compatibility", () => {
  assert.match(source, /createDemoCustomer:\s*false/);
  assert.doesNotMatch(source, /createDemoCustomer:\s*true/);
  assert.match(source, /Demo customer creation is temporarily unavailable for the current loyalty setup\./);
});

test("merchant onboarding displays safe structured backend messages and preserves success UI", () => {
  assert.match(source, /payload\?\.message/);
  assert.match(source, /\[submitError\.message, detailText\]/);
  assert.match(source, /normalizeOnboardResponse\(payload \|\| \{\}, form\)/);
  assert.match(source, /setCreatedPayload\(payload \|\| \{\}\)/);
  assert.match(source, /setStep\(5\)/);
});
