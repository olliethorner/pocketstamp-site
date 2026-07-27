import test from "node:test";
import assert from "node:assert/strict";
import { getScannerActivityLabel, normalizeScannerActivities } from "./scannerActivity.js";

test("normalizes persisted scanner activity newest first and limits it to five", () => {
  const activities = Array.from({ length: 7 }, (_, index) => ({
    id: `event-${index}`,
    type: "stamp_added",
    createdAt: `2026-07-27T14:0${index}:00.000Z`,
  }));
  assert.deepEqual(
    normalizeScannerActivities({ activities }).map((activity) => activity.id),
    ["event-6", "event-5", "event-4", "event-3", "event-2"],
  );
});

test("deduplicates stable event ids returned after an optimistic update", () => {
  const event = { id: "scanner:event-1", type: "stamp_added", createdAt: "2026-07-27T14:30:00.000Z" };
  assert.equal(normalizeScannerActivities({ activities: [event, { ...event }] }).length, 1);
});

test("returns an empty list only for an empty persisted response", () => {
  assert.deepEqual(normalizeScannerActivities({ activities: [] }), []);
  assert.deepEqual(normalizeScannerActivities(null), []);
});

test("supports persisted activity labels", () => {
  assert.equal(getScannerActivityLabel("stamp_added"), "Stamp added");
  assert.equal(getScannerActivityLabel("reward_redeemed"), "Reward redeemed");
  assert.equal(getScannerActivityLabel("stamps_adjusted"), "Stamp count updated");
});
