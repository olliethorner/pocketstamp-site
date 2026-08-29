import test from "node:test";
import assert from "node:assert/strict";
import { buildPosMutationPayload, extractPosRecords, posSummary } from "./posCompatibility.js";

test("normalizes backend snake_case compatibility records", () => {
  const [record] = extractPosRecords({ records: [{ id: "1", name: "Square", cafes_seen: 1, native_scanner_status: "needs_testing" }] });
  assert.equal(record.cafesSeen, 1);
  assert.equal(record.nativeScannerStatus, "needs_testing");
  assert.equal(record.physicalTestStatus, "not_tested");
});

test("derives honest compatibility summary counts", () => {
  const records = extractPosRecords({ records: [
    { name: "Proven", native_scanner_status: "ready", physical_test_status: "passed", api_status: "strong_opportunity", cafes_seen: 2 },
    { name: "Paper research", native_scanner_status: "likely_compatible", physical_test_status: "not_tested", cafes_seen: 1 },
  ] });
  assert.deepEqual(posSummary(records), { total: 2, scannerReady: 1, needsTesting: 1, apiOpportunities: 1, standalone: 0, sightings: 3 });
});

test("mutation payload allow-lists fields and clamps café counts", () => {
  const payload = buildPosMutationPayload({ id: "secret", name: " Square ", cafesSeen: -4, injected: true });
  assert.equal(payload.name, "Square");
  assert.equal(payload.cafesSeen, 0);
  assert.equal("id" in payload, false);
  assert.equal("injected" in payload, false);
});
