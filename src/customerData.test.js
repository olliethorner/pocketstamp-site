import assert from "node:assert/strict";
import test from "node:test";
import {
  getCustomerDetailFields,
  getCustomerStatus,
  getVisibleCustomers,
  supportsScannedTodayFilter,
} from "./merchant/utils/customerData.js";

test("derives reward-ready and almost-there status from existing stamp fields", () => {
  assert.equal(getCustomerStatus({ currentStamps: 10, rewardThreshold: 10 }), "Reward ready");
  assert.equal(getCustomerStatus({ currentStamps: 8, rewardThreshold: 10 }), "Almost there");
  assert.equal(getCustomerStatus({ currentStamps: 3, rewardThreshold: 10 }), "Active");
});

test("respects explicit existing reward status values", () => {
  assert.equal(getCustomerStatus({ rewardStatus: "reward_ready", currentStamps: 1 }), "Reward ready");
  assert.equal(getCustomerStatus({ status: "almost_there", currentStamps: 1 }), "Almost there");
});

test("filters scanned-today customers only when selected", () => {
  const customers = [{ id: "one", scannedToday: true }, { id: "two", scannedToday: false }];
  assert.equal(supportsScannedTodayFilter(customers), true);
  assert.deepEqual(getVisibleCustomers(customers, "scanned_today").map(({ id }) => id), ["one"]);
  assert.equal(getVisibleCustomers(customers, "all").length, 2);
});

test("expanded merchant details do not expose Card ID", () => {
  const fields = getCustomerDetailFields({
    email: "customer@example.com",
    passSerialNumber: "technical-card-id",
  });
  assert.equal(fields.some(([label]) => label === "Card ID"), false);
  assert.equal(fields.some(([, value]) => value === "technical-card-id"), false);
});

test("empty returned customer sets remain empty", () => {
  assert.deepEqual(getVisibleCustomers([], "all"), []);
});
