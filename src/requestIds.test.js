import assert from "node:assert/strict";
import test from "node:test";

import {
  createRequestId,
  getOrCreateActionRequest,
  isAmbiguousMutationFailure,
  isValidRequestId,
  REQUEST_ID_PATTERN,
} from "./merchant/requestIds.js";

const UUID_A = "123e4567-e89b-42d3-a456-426614174000";
const UUID_B = "123e4567-e89b-42d3-a456-426614174001";

test("generated request IDs use randomUUID and match the backend contract", () => {
  let calls = 0;
  const requestId = createRequestId("scanner.scan", {
    randomUUID() {
      calls += 1;
      return UUID_A;
    },
  });
  assert.equal(requestId, `scanner.scan.${UUID_A}`);
  assert.equal(calls, 1);
  assert.match(requestId, REQUEST_ID_PATTERN);
  assert.equal(isValidRequestId(requestId), true);
});

test("fallback uses getRandomValues without Math.random", () => {
  const originalRandom = Math.random;
  Math.random = () => { throw new Error("Math.random must not be used"); };
  try {
    let calls = 0;
    const requestId = createRequestId("scanner.redeem", {
      getRandomValues(bytes) {
        calls += 1;
        bytes.fill(7);
        return bytes;
      },
    });
    assert.equal(calls, 1);
    assert.match(requestId, REQUEST_ID_PATTERN);
  } finally {
    Math.random = originalRandom;
  }
});

test("namespaces produce distinct IDs", () => {
  const cryptoObject = { randomUUID: () => UUID_A };
  assert.notEqual(
    createRequestId("scanner.scan", cryptoObject),
    createRequestId("scanner.adjust", cryptoObject),
  );
});

test("one action reuses its ID while a new action gets a new ID", () => {
  const uuids = [UUID_A, UUID_B];
  const cryptoObject = { randomUUID: () => uuids.shift() };
  const first = getOrCreateActionRequest(null, "scanner.scan", "barcode-a", cryptoObject);
  const duplicate = getOrCreateActionRequest(first, "scanner.scan", "barcode-a", cryptoObject);
  const next = getOrCreateActionRequest(first, "scanner.scan", "barcode-b", cryptoObject);
  assert.strictEqual(duplicate, first);
  assert.equal(duplicate.requestId, first.requestId);
  assert.notEqual(next.requestId, first.requestId);
});

test("transport failures are ambiguous but server responses are definitive", () => {
  assert.equal(isAmbiguousMutationFailure(new TypeError("fetch failed")), true);
  assert.equal(isAmbiguousMutationFailure(Object.assign(new Error("timeout"), { name: "AbortError" })), true);
  assert.equal(isAmbiguousMutationFailure(Object.assign(new Error("rejected"), { status: 400 })), false);
  assert.equal(isAmbiguousMutationFailure(Object.assign(new Error("server error"), { status: 500 })), false);
});

test("scan, redemption, and adjustment lifecycle keys enforce retry semantics", () => {
  const values = [UUID_A, UUID_B, "123e4567-e89b-42d3-a456-426614174002"];
  const cryptoObject = { randomUUID: () => values.shift() };

  const redemption = getOrCreateActionRequest(null, "scanner.redeem", "confirmation:one", cryptoObject);
  assert.strictEqual(
    getOrCreateActionRequest(redemption, "scanner.redeem", "confirmation:one", cryptoObject),
    redemption,
  );
  const newConfirmation = getOrCreateActionRequest(null, "scanner.redeem", "confirmation:two", cryptoObject);
  assert.notEqual(newConfirmation.requestId, redemption.requestId);

  const adjustment = getOrCreateActionRequest(null, "scanner.adjust", "pass-a|4|correction", cryptoObject);
  assert.strictEqual(
    getOrCreateActionRequest(adjustment, "scanner.adjust", "pass-a|4|correction", cryptoObject),
    adjustment,
  );
  assert.notEqual(
    getOrCreateActionRequest(adjustment, "scanner.adjust", "pass-a|5|correction", { randomUUID: () => UUID_A }).requestId,
    adjustment.requestId,
  );
  assert.notEqual(
    getOrCreateActionRequest(adjustment, "scanner.adjust", "pass-a|4|other", { randomUUID: () => UUID_A }).requestId,
    adjustment.requestId,
  );
  assert.notEqual(
    getOrCreateActionRequest(adjustment, "scanner.adjust", "pass-b|4|correction", { randomUUID: () => UUID_A }).requestId,
    adjustment.requestId,
  );
});
