import test from "node:test";
import assert from "node:assert/strict";
import {
  canManageCampaigns,
  getCampaignDeliveredText,
  getCampaignStatusLabel,
  isFutureLocalDateTime,
  normalizeCampaignRows,
  toScheduledAtIso,
} from "./merchantCampaigns.js";

test("only unscoped owners and managers can manage campaigns", () => {
  assert.equal(canManageCampaigns({ role: "owner", locationId: null }), true);
  assert.equal(canManageCampaigns({ role: "manager", locationId: null }), true);
  assert.equal(canManageCampaigns({ role: "staff", locationId: null }), false);
  assert.equal(canManageCampaigns({ role: "owner", locationId: "loc_1" }), false);
  assert.equal(canManageCampaigns({ role: "manager", locationId: "loc_1" }), false);
  assert.equal(canManageCampaigns({ role: "owner" }), false);
  assert.equal(canManageCampaigns({ role: "manager", locationName: "Primary" }), false);
  assert.equal(canManageCampaigns(null), false);
});

test("maps all campaign statuses", () => {
  assert.deepEqual(
    ["scheduled", "processing", "sent", "partially_failed", "failed", "cancelled"].map(getCampaignStatusLabel),
    ["Scheduled", "Processing", "Sent", "Partially sent", "Failed", "Cancelled"],
  );
});

test("shows delivery copy only for completed delivery statuses", () => {
  assert.equal(getCampaignDeliveredText("sent", 12), "Delivered to 12 customers");
  assert.equal(getCampaignDeliveredText("partially_failed", 7), "Delivered to 7 customers");
  assert.equal(getCampaignDeliveredText("sent", 0), "Delivered to 0 customers");
  assert.equal(getCampaignDeliveredText("failed", 9), "Delivered to 0 customers");
  for (const value of [null, undefined, "", "12", "not-a-number", -1]) {
    assert.equal(getCampaignDeliveredText("sent", value), "");
    assert.equal(getCampaignDeliveredText("partially_failed", value), "");
  }
  for (const status of ["scheduled", "processing", "cancelled"]) {
    assert.equal(getCampaignDeliveredText(status, 4), "");
  }
});

test("normalization retains only allowlisted presentation fields", () => {
  const [row] = normalizeCampaignRows({ campaigns: [{
    id: "campaign_1", message: "Hello", scheduledAt: "2030-01-02T12:00:00.000Z",
    status: "sent", deliveredCount: 3, merchantId: "secret", createdByMerchantUserId: "user_1",
    processingStartedAt: "technical", apnsError: "certificate failed", passSerials: ["serial"],
    delivery_unknown: true,
  }] });
  assert.deepEqual(row, {
    id: "campaign_1", message: "Hello", scheduledAt: "2030-01-02T12:00:00.000Z",
    status: "sent", statusLabel: "Sent", deliveredText: "Delivered to 3 customers",
  });
  assert.equal("merchantId" in row, false);
  assert.equal("apnsError" in row, false);
  assert.equal("passSerials" in row, false);
  assert.equal("delivery_unknown" in row, false);
});

test("validates future local datetime values", () => {
  const now = new Date("2030-01-01T12:00:00.000Z");
  assert.equal(isFutureLocalDateTime("2030-01-01T13:00", now), true);
  assert.equal(isFutureLocalDateTime("2030-01-01T12:00", now), false);
  assert.equal(isFutureLocalDateTime("2029-12-31T12:00", now), false);
  assert.equal(isFutureLocalDateTime("not-a-date", now), false);
});

test("converts local datetime to ISO", () => {
  const value = "2030-06-15T14:30";
  assert.equal(toScheduledAtIso(value), new Date(value).toISOString());
});
