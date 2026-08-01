import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildScannerAdjustmentRequest,
  buildScannerLookupRequest,
  buildScannerRedemptionRequest,
  buildScannerScanRequest,
  buildScannerUndoRequest,
} from "./merchant/scannerRequests.js";

const requestId = "scanner.scan.123e4567-e89b-42d3-a456-426614174000";

test("registered scanner scan preserves its fields and sends requestId", () => {
  assert.deepEqual(buildScannerScanRequest({
    deviceToken: "device-token",
    scanValue: "psm_scan-value",
    requestId,
  }), {
    deviceToken: "device-token",
    scanValue: "psm_scan-value",
    requestId,
  });
});

test("adjustment and redemption payloads send requestId without changing existing fields", () => {
  assert.deepEqual(buildScannerAdjustmentRequest({
    deviceToken: "device-token",
    stamps: 4,
    note: "Customer correction",
    requestId,
    pass: { passSerial: "pass-1" },
  }), {
    deviceToken: "device-token",
    stamps: 4,
    stampCount: 4,
    currentStamps: 4,
    requestId,
    note: "Customer correction",
    reason: "Customer correction",
    passSerial: "pass-1",
  });

  assert.deepEqual(buildScannerRedemptionRequest({
    action: { deviceToken: "device-token", eventId: "event-1", scanEventId: "event-1" },
    requestId,
  }), {
    deviceToken: "device-token",
    eventId: "event-1",
    scanEventId: "event-1",
    requestId,
  });
});

test("lookup and event-derived undo remain requestId-free", () => {
  const lookup = buildScannerLookupRequest({
    deviceToken: "device-token",
    scanValue: "psm_scan-value",
    pass: { passSerial: "pass-1" },
  });
  const undo = buildScannerUndoRequest({
    action: { deviceToken: "device-token", eventId: "event-1", scanEventId: "event-1" },
  });

  assert.deepEqual(lookup, {
    deviceToken: "device-token",
    scanValue: "psm_scan-value",
    passSerial: "pass-1",
  });
  assert.deepEqual(undo, {
    deviceToken: "device-token",
    eventId: "event-1",
    scanEventId: "event-1",
  });
  assert.equal("requestId" in lookup, false);
  assert.equal("requestId" in undo, false);
});

test("requestId is not written to scanner logs or rendered UI", () => {
  const source = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  const consoleCalls = source.match(/console\.(?:info|warn|error)\([\s\S]*?\);/g) || [];

  for (const call of consoleCalls) assert.doesNotMatch(call, /requestId/);
  assert.doesNotMatch(source, /children:\s*[^,\n]*requestId|>\s*\{[^}\n]*requestId[^}\n]*\}\s*</);
});
