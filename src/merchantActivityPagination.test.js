import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fetchMerchantActivity } from "./merchant/api/merchantApi.js";

test("Activity API sends server page and merchant-local period parameters", async () => {
  const originalFetch = globalThis.fetch;
  let requested;
  globalThis.fetch = async (url) => {
    requested = new URL(url);
    return { ok: true, text: async () => JSON.stringify({ activity: [], pagination: { page: 2, pageSize: 25, total: 40, totalPages: 2 } }) };
  };
  try {
    const payload = await fetchMerchantActivity("token", { page: 2, pageSize: 25, period: "7_days" });
    assert.equal(requested.pathname, "/api/merchant/activity");
    assert.equal(requested.searchParams.get("page"), "2");
    assert.equal(requested.searchParams.get("pageSize"), "25");
    assert.equal(requested.searchParams.get("period"), "7_days");
    assert.equal(payload.pagination.total, 40);
  } finally { globalThis.fetch = originalFetch; }
});

test("Activity page renders totals, stamp context, distinct redemption, pagination and truthful empty states", async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const { default: MerchantActivity } = await vite.ssrLoadModule("/src/merchant/pages/MerchantActivity.jsx");
    const rows = [
      { id: "stamp", type: "stamp", customerName: "Alex", balanceBefore: 4, balanceAfter: 5, createdAt: "2026-08-11T10:00:00Z" },
      { id: "redeem", type: "redemption", result: "rewardRedeemed", customerName: "Jamie", createdAt: "2026-08-11T09:00:00Z" },
    ];
    const markup = renderToStaticMarkup(React.createElement(MerchantActivity, { activityRows: rows, isLoading: false, error: "", period: "all", onPeriodChange() {}, pagination: { page: 2, pageSize: 25, total: 40, totalPages: 2 }, onPageChange() {} }));
    assert.match(markup, /Showing 26-27 of 40 activities/);
    assert.match(markup, /Alex · 4 → 5 stamps/);
    assert.match(markup, /Reward redeemed/);
    assert.match(markup, /bg-violet-50/);
    assert.match(markup, /Page 2 of 2/);
    assert.match(markup, /disabled=""[^>]*>Next/);
    const periodEmpty = renderToStaticMarkup(React.createElement(MerchantActivity, { activityRows: [], isLoading: false, error: "", period: "7_days", onPeriodChange() {}, pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0 }, onPageChange() {} }));
    assert.match(periodEmpty, /No activity in this period\./);
    assert.match(periodEmpty, /Show all activity/);
    const allEmpty = renderToStaticMarkup(React.createElement(MerchantActivity, { activityRows: [], isLoading: false, error: "", period: "all", onPeriodChange() {}, pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0 }, onPageChange() {} }));
    assert.match(allEmpty, /Activity will appear here when customers collect stamps or redeem rewards\./);
    const preview = renderToStaticMarkup(React.createElement(MerchantActivity, { activityRows: Array.from({ length: 6 }, (_, index) => ({ id: String(index), type: "stamp", customerName: `Customer ${index}`, createdAt: "2026-08-11T10:00:00Z" })), isLoading: false, error: "", preview: true }));
    assert.equal((preview.match(/aria-expanded/g) || []).length, 0);
    assert.equal((preview.match(/Stamp added/g) || []).length, 5);
  } finally { await vite.close(); }
});

test("Activity dashboard keeps period/page reset and stale-response protection server-backed", () => {
  const dashboard = fs.readFileSync(new URL("./merchant/MerchantDashboard.jsx", import.meta.url), "utf8");
  const activity = fs.readFileSync(new URL("./merchant/pages/MerchantActivity.jsx", import.meta.url), "utf8");
  assert.match(dashboard, /requestGeneration !== activityRequestGenerationRef\.current/);
  assert.match(dashboard, /page: activityPagination\.page, pageSize: 25, period: activityPeriod/);
  assert.match(dashboard, /setActivityPagination\(\(current\) => \(\{ \.\.\.current, page: 1 \}\)\)/);
  assert.doesNotMatch(activity, /filterActivityRows|\.slice\(\(safePage/);
  assert.doesNotMatch(activity, /Apple Wallet/);
});
