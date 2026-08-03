import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  createRequestId,
  createScannerMutationActionController,
  getOrCreateActionRequest,
  isAmbiguousMutationFailure,
  isValidRequestId,
  REQUEST_ID_PATTERN,
} from "./merchant/requestIds.js";
import {
  buildScannerAdjustmentRequest,
  buildScannerRedemptionRequest,
  buildScannerScanRequest,
} from "./merchant/scannerRequests.js";

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

function response(ok, body = {}) {
  return { ok, status: ok ? 200 : 409, async json() { return body; } };
}

function bindAction(controller, fetchMock, route, actionKey, buildPayload) {
  return () => controller.submit(actionKey, async (requestId) => {
    const result = await fetchMock(route, {
      method: "POST",
      body: JSON.stringify(buildPayload(requestId)),
    });
    if (!result.ok) throw Object.assign(new Error("Definite HTTP failure"), { status: result.status });
    return result.json();
  });
}

test("production action controller blocks same-turn duplicate networking", async () => {
  let generated = 0;
  let release;
  const calls = [];
  const controller = createScannerMutationActionController({
    namespace: "scanner.scan",
    createId: () => `scanner.scan.${[UUID_A, UUID_B][generated++]}`,
  });
  const fetchMock = async (...args) => {
    calls.push(args);
    return new Promise((resolve) => { release = () => resolve(response(true, { ok: true })); });
  };
  const submit = bindAction(controller, fetchMock, "/api/merchant/scanner/scan", "scan-value", (requestId) => (
    buildScannerScanRequest({ deviceToken: "device", scanValue: "scan-value", requestId })
  ));

  const first = submit();
  assert.deepEqual(await submit(), { accepted: false });
  assert.equal(calls.length, 1);
  assert.equal(generated, 1);
  release();
  assert.equal((await first).accepted, true);
});

test("ambiguous retry survives rebinding, reuses its ID, and has zero automatic fallback", async () => {
  let generated = 0;
  const calls = [];
  const controller = createScannerMutationActionController({
    namespace: "scanner.scan",
    createId: () => `scanner.scan.${[UUID_A, UUID_B][generated++]}`,
  });
  const fetchMock = async (...args) => {
    calls.push(args);
    if (calls.length === 1) throw new TypeError("Failed to fetch");
    return response(true, { ok: true });
  };
  const bind = () => bindAction(controller, fetchMock, "/api/merchant/scanner/scan", "scan-value", (requestId) => (
    buildScannerScanRequest({ deviceToken: "device", scanValue: "scan-value", requestId })
  ));

  await assert.rejects(bind()(), /Failed to fetch/);
  assert.deepEqual(controller.state(), { pending: false, unresolved: true });
  assert.equal(calls.length, 1);
  assert.equal(generated, 1);
  await bind()();
  assert.equal(calls.length, 2);
  assert.equal(generated, 1);
  assert.equal(JSON.parse(calls[0][1].body).requestId, JSON.parse(calls[1][1].body).requestId);
  assert.deepEqual(calls.map(([route]) => route), [
    "/api/merchant/scanner/scan",
    "/api/merchant/scanner/scan",
  ]);
});

test("definite results clear IDs and all mutation payloads retain their fields", async () => {
  const ids = [UUID_A, UUID_B, "123e4567-e89b-42d3-a456-426614174002"];
  let generated = 0;
  const calls = [];
  const controller = createScannerMutationActionController({
    namespace: "scanner.scan",
    createId: () => `scanner.scan.${ids[generated++]}`,
  });
  const fetchMock = async (...args) => {
    calls.push(args);
    return calls.length === 2 ? response(false) : response(true, { ok: true });
  };
  const submit = (key) => bindAction(controller, fetchMock, "/api/merchant/scanner/scan", key, (requestId) => (
    buildScannerScanRequest({ deviceToken: "device", scanValue: key, requestId })
  ))();

  await submit("success");
  await assert.rejects(submit("definite-failure"), /Definite HTTP failure/);
  await submit("after-failure");
  assert.equal(generated, 3);
  assert.equal(new Set(calls.map((call) => JSON.parse(call[1].body).requestId)).size, 3);
  assert.deepEqual(controller.state(), { pending: false, unresolved: false });

  const requestId = `scanner.test.${UUID_A}`;
  assert.deepEqual(buildScannerAdjustmentRequest({
    deviceToken: "device", stamps: 4, note: "Correction", requestId, pass: { passSerial: "pass" },
  }), {
    deviceToken: "device", stamps: 4, stampCount: 4, currentStamps: 4,
    requestId, note: "Correction", reason: "Correction", passSerial: "pass",
  });
  assert.deepEqual(buildScannerRedemptionRequest({
    action: { deviceToken: "device", eventId: "event", scanEventId: "event" }, requestId,
  }), { deviceToken: "device", eventId: "event", scanEventId: "event", requestId });
});

test("Scanner Mode retains production controllers across renders without persistence surfaces", () => {
  const appSource = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  const helperSource = fs.readFileSync(new URL("./merchant/requestIds.js", import.meta.url), "utf8");

  assert.match(appSource, /scanActionControllerRef\.current\.submit\(trimmedValue/);
  assert.match(appSource, /adjustmentActionControllerRef\.current\.submit\(adjustmentKey/);
  assert.match(appSource, /redemptionActionControllerRef\.current\.submit\(redemptionKey/);
  assert.match(appSource, /if \(!scanActionControllerRef\.current\)/);
  assert.doesNotMatch(helperSource, /localStorage|sessionStorage|indexedDB|URLSearchParams|console\.|analytics/);
});
