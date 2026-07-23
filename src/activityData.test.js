import assert from "node:assert/strict";
import test from "node:test";
import { classifyActivity, filterActivityRows, formatActivityTitle } from "./merchant/utils/activityData.js";

const now = new Date("2026-07-23T12:00:00.000Z");
const rows = [
  { id: "today", type: "stamp_added", createdAt: "2026-07-23T10:00:00.000Z" },
  { id: "week", type: "customer_joined", createdAt: "2026-07-18T10:00:00.000Z" },
  { id: "month", type: "reward_redeemed", createdAt: "2026-07-01T10:00:00.000Z" },
  { id: "old", type: "stamp_added", createdAt: "2026-05-01T10:00:00.000Z" },
];

test("filters only the supplied recent dataset by date", () => {
  assert.deepEqual(filterActivityRows(rows, "today", now).map(({ id }) => id), ["today"]);
  assert.deepEqual(filterActivityRows(rows, "7_days", now).map(({ id }) => id), ["today", "week"]);
  assert.deepEqual(filterActivityRows(rows, "30_days", now).map(({ id }) => id), ["today", "week", "month"]);
  assert.equal(filterActivityRows(rows, "all", now), rows);
});

test("empty and unmatched supplied datasets remain empty", () => {
  assert.deepEqual(filterActivityRows([], "all", now), []);
  assert.deepEqual(filterActivityRows([rows[3]], "today", now), []);
});

test("classifies representative existing activity types", () => {
  assert.equal(classifyActivity({ type: "stamp_added" }), "stamp");
  assert.equal(classifyActivity({ type: "reward_redeemed" }), "reward");
  assert.equal(classifyActivity({ type: "customer_joined" }), "join");
  assert.equal(classifyActivity({ type: "wallet_pass_created" }), "wallet");
  assert.equal(classifyActivity({ type: "reminder_sent" }), "reminder");
  assert.equal(formatActivityTitle({ type: "reward_redeemed" }), "Reward redeemed");
});
