import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createOptimisticScannerActivity,
  getQuickExtraStampTarget,
  getScannerActivityLabel,
  normalizeScannerActivities,
  prependScannerActivity,
} from "./scannerActivity.js";

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

test("quick extra stamp is limited to the newest eligible stamp activity below threshold", () => {
  const activity = { type: "stamp_added", passSerialNumber: "pass-a", stampCount: 4 };
  assert.equal(getQuickExtraStampTarget(activity, 10), 5);
  assert.equal(getQuickExtraStampTarget({ ...activity, type: "stamps_adjusted" }, 10), 5);
  assert.equal(getQuickExtraStampTarget({ ...activity, stampCount: 10 }, 10), null);
  assert.equal(getQuickExtraStampTarget({ ...activity, type: "reward_redeemed" }, 10), null);
  assert.equal(getQuickExtraStampTarget({ ...activity, passSerialNumber: null }, 10), null);
});

test("server activity replaces optimistic state and remains newest-five without duplicates", () => {
  const optimistic = createOptimisticScannerActivity("stamp_added", {
    customerName: "Jamie",
    passSerialNumber: "pass-1",
    stampCount: 3,
  }, "2026-08-07T12:01:00.000Z");
  const fallback = prependScannerActivity([], optimistic);
  assert.equal(fallback.length, 1);
  assert.equal(fallback[0].customerName, "Jamie");

  const persisted = Array.from({ length: 7 }, (_, index) => ({
    id: index < 2 ? "persisted-duplicate" : `persisted-${index}`,
    type: "stamp_added",
    createdAt: `2026-08-07T12:0${index}:00.000Z`,
  }));
  const authoritative = normalizeScannerActivities({ activities: persisted });
  assert.deepEqual(
    authoritative.map((activity) => activity.id),
    ["persisted-6", "persisted-5", "persisted-4", "persisted-3", "persisted-2"],
  );
  assert.equal(authoritative.some((activity) => activity.id === optimistic.id), false);
});

test("Scanner Mode hydrates and refetches provider-neutral persisted activity after every successful mutation", () => {
  const source = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "App.jsx"),
    "utf8",
  );

  assert.match(source, /fetchScannerActivity\(deviceToken\)/);
  assert.match(source, /setDeviceLoadStatus\("ready"\);[\s\S]{0,160}void loadRecentActivity\(\)/);
  assert.equal((source.match(/if \(!await loadRecentActivity\(\)\) addFallbackActivity\(/g) || []).length, 5);
  assert.match(source, /addFallbackActivity\("stamp_added", payload\)/);
  assert.match(source, /addFallbackActivity\("stamps_adjusted", mergedResult\)/);
  assert.match(source, /addFallbackActivity\("reward_redeemed", payload\)/);
  assert.match(source, /addFallbackActivity\("stamp_undone", payload\)/);
  assert.doesNotMatch(source, /apple[\s\S]{0,80}loadRecentActivity|google[\s\S]{0,80}loadRecentActivity/i);
});
