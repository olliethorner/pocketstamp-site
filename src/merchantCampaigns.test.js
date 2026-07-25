import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  canManageCampaigns,
  getCampaignDeliveredText,
  getCampaignStatusLabel,
  getCampaignStatusPresentation,
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
  assert.equal(canManageCampaigns(null), false);
});

test("maps campaign statuses to merchant lifecycle labels", () => {
  const statuses = {
    scheduled: "Scheduled",
    pending: "Scheduled",
    sending: "Sending",
    processing: "Sending",
    partially_sent: "Sending",
    sent: "Complete",
    completed: "Complete",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    completed_with_failures: "Complete",
    failed: "Complete",
    partially_failed: "Complete",
  };

  for (const [status, label] of Object.entries(statuses)) {
    assert.equal(getCampaignStatusLabel(status), label);
  }
});

test("finished delivery outcome requires explicit successful and failed counts for issues", () => {
  assert.equal(getCampaignStatusLabel({
    status: "partially_sent", completedAt: "2030-01-02T12:00:00.000Z",
    deliveredCount: 7, recipientCount: 10,
  }), "Complete");
  assert.equal(getCampaignStatusLabel({
    status: "partially_sent", completedAt: "2030-01-02T12:00:00.000Z",
    deliveredCount: 7, failedCount: 2,
  }), "Completed with issues");
  assert.equal(getCampaignStatusLabel({
    status: "partially_sent", deliveredCount: 7, recipientCount: 10,
  }), "Sending");
});

test("legacy warning statuses prioritize successful delivery outcomes", () => {
  assert.equal(getCampaignStatusLabel({ status: "partially_failed", deliveredCount: 4 }), "Complete");
  assert.equal(getCampaignStatusLabel({ status: "partially_failed", deliveredCount: 1 }), "Complete");
  assert.equal(getCampaignStatusLabel({ status: "failed", deliveredCount: 1 }), "Complete");
  assert.equal(getCampaignStatusLabel({ status: "completed", deliveredCount: 0 }), "Not delivered");
});

test("unknown statuses use an allowlisted presentation and never leak raw text", () => {
  assert.deepEqual(getCampaignStatusPresentation("queued_by_worker_v2"), {
    label: "Sending", tone: "progress",
  });
  assert.equal(getCampaignStatusLabel("queued_by_worker_v2"), "Sending");
  assert.equal(getCampaignStatusLabel({
    status: "queued_by_worker_v2", completedAt: "2030-01-02T12:00:00.000Z", deliveredCount: 3,
  }), "Complete");
  assert.equal(getCampaignStatusLabel({
    status: "queued_by_worker_v2", completedAt: "2030-01-02T12:00:00.000Z", deliveredCount: 0,
  }), "Not delivered");
});

test("MerchantMarketing renders only centralized merchant badge labels", async () => {
  const vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  try {
    const { default: MerchantMarketing } = await vite.ssrLoadModule("/src/merchant/pages/MerchantMarketing.jsx");
    const campaigns = [
      { id: "1", message: "One", scheduledAt: "2030-01-01T12:00:00.000Z", status: "partially_failed", deliveredCount: 1, statusLabel: "raw_leak", deliveredText: "Delivered to 1 customer" },
      { id: "2", message: "Two", scheduledAt: "2030-01-01T12:00:00.000Z", status: "backend_worker_v2", statusLabel: "raw_leak", deliveredText: "Sending to customers…" },
    ];
    const html = renderToStaticMarkup(MerchantMarketing({
      merchantContext: { role: "staff", locationId: null }, campaigns,
      isLoading: false, error: null, onRefresh: async () => {},
      reminderSummary: {}, isReminderSummaryLoading: false, reminderError: null,
      birthdayRewardsEnabled: false,
    }));
    assert.match(html, />Complete<\/span>/);
    assert.match(html, />Sending<\/span>/);
    assert.match(html, /Delivered to 1 customer/);
    assert.match(html, /Sending to customers…/);
    assert.doesNotMatch(html, /raw_leak|backend_worker_v2|partially_sent/);
  } finally {
    await vite.close();
  }
});

test("uses lifecycle delivery copy with singular and plural recipients", () => {
  assert.equal(getCampaignDeliveredText("sent", 1), "Delivered to 1 customer");
  assert.equal(getCampaignDeliveredText("completed", 12), "Delivered to 12 customers");
  assert.equal(getCampaignDeliveredText("completed_with_failures", 7), "Delivered to 7 customers");
  assert.equal(getCampaignDeliveredText({ status: "completed", deliveredCount: 0 }, 0), "Delivered to 0 customers");
  assert.equal(getCampaignDeliveredText("processing", 4), "Delivered to 4 customers");
  assert.equal(getCampaignDeliveredText("sending", 0), "Sending to customers…");
  assert.equal(getCampaignDeliveredText("processing", undefined), "Sending to customers…");
  assert.equal(getCampaignDeliveredText("scheduled", 4), "");
  assert.equal(getCampaignDeliveredText("cancelled", 4), "");
  assert.equal(getCampaignDeliveredText("sent", -1), "");
});

test("normalization retains only allowlisted presentation fields", () => {
  const [row] = normalizeCampaignRows({ campaigns: [{
    id: "campaign_1", message: "Hello", scheduledAt: "2030-01-02T12:00:00.000Z",
    status: "sent", deliveredCount: 3, merchantId: "secret", apnsError: "certificate failed",
  }] });
  assert.deepEqual(row, {
    id: "campaign_1", message: "Hello", scheduledAt: "2030-01-02T12:00:00.000Z",
    status: "sent", statusLabel: "Complete", statusTone: "success",
    deliveredText: "Delivered to 3 customers",
  });
  assert.equal("merchantId" in row, false);
  assert.equal("apnsError" in row, false);
});

test("normalization marks a genuinely finished partial campaign as issues only with explicit failures", () => {
  const [row] = normalizeCampaignRows([{ status: "partially_sent", deliveredCount: 4,
    failedCount: 2, completedAt: "2030-01-02T12:00:00.000Z" }]);
  assert.equal(row.statusLabel, "Completed with issues");
  assert.equal(row.statusTone, "warning");
  assert.equal(row.deliveredText, "Delivered to 4 customers");
  assert.equal(getCampaignStatusLabel(row), "Completed with issues");
});

test("normalization does not infer failures from recipient estimates or legacy statuses", () => {
  const rows = normalizeCampaignRows([
    { status: "partially_failed", deliveredCount: 4, recipientCount: 10 },
    { status: "partially_failed", deliveredCount: 1 },
    { status: "completed", deliveredCount: 0 },
  ]);
  assert.deepEqual(rows.map(({ statusLabel, deliveredText }) => ({ statusLabel, deliveredText })), [
    { statusLabel: "Complete", deliveredText: "Delivered to 4 customers" },
    { statusLabel: "Complete", deliveredText: "Delivered to 1 customer" },
    { statusLabel: "Not delivered", deliveredText: "Delivered to 0 customers" },
  ]);
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
