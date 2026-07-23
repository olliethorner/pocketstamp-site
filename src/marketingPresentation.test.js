import assert from "node:assert/strict";
import test from "node:test";
import {
  canCancelCampaign,
  getReminderBehaviours,
  getReminderStats,
} from "./merchant/utils/marketingPresentation.js";

test("uses only backend reminder summary values with safe defaults", () => {
  assert.deepEqual(getReminderStats({ sentThisMonth: 12, scheduled: 3 }), {
    sentThisMonth: 12,
    scheduled: 3,
  });
  assert.deepEqual(getReminderStats(null), { sentThisMonth: 0, scheduled: 0 });
});

test("describes reminder types without hard-coded active health claims", () => {
  const disabled = getReminderBehaviours(false);
  assert.equal(disabled.length, 5);
  assert.equal(disabled.flat().some((value) => value === "Active"), false);
  assert.match(disabled.find(([title]) => title === "Birthday reminder")[1], /when birthday rewards are enabled/i);
  assert.match(getReminderBehaviours(true).find(([title]) => title === "Birthday reminder")[1], /are enabled/i);
});

test("cancellation is available only for manageable scheduled campaigns", () => {
  assert.equal(canCancelCampaign({ status: "scheduled" }, true), true);
  assert.equal(canCancelCampaign({ status: "sent" }, true), false);
  assert.equal(canCancelCampaign({ status: "scheduled" }, false), false);
});
