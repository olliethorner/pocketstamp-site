import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fetchMerchantCustomers } from "./merchant/api/merchantApi.js";

test("customer API requests the selected server page with full-result search and filters", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = new URL(url);
    return { ok: true, text: async () => JSON.stringify({ customers: [], pagination: { page: 2, pageSize: 10, total: 13, totalPages: 2 } }) };
  };
  try {
    const payload = await fetchMerchantCustomers("token", { page: 2, pageSize: 10, search: " Sarah ", status: "reward_ready" });
    assert.equal(requestedUrl.pathname, "/api/merchant/customers");
    assert.equal(requestedUrl.searchParams.get("page"), "2");
    assert.equal(requestedUrl.searchParams.get("pageSize"), "10");
    assert.equal(requestedUrl.searchParams.get("search"), "Sarah");
    assert.equal(requestedUrl.searchParams.get("status"), "reward_ready");
    assert.equal(payload.pagination.total, 13);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("customer dashboard keeps page state server-backed, resettable, debounced, and stale-safe", () => {
  const dashboard = fs.readFileSync(new URL("./merchant/MerchantDashboard.jsx", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("./merchant/pages/MerchantCustomers.jsx", import.meta.url), "utf8");
  assert.match(dashboard, /page: customerPagination\.page/);
  assert.match(dashboard, /setDebouncedCustomerSearch\(customerSearch\), 300/);
  assert.match(dashboard, /requestGeneration !== customerRequestGenerationRef\.current/);
  assert.equal((dashboard.match(/page: 1/g) || []).length >= 2, true);
  assert.match(page, /Showing \$\{pageStart \+ 1\}-\$\{Math\.min\(pageStart \+ customers\.length, total\)\} of \$\{total\} customers/);
  assert.match(page, /Your first customer will appear here after someone scans your join QR\./);
  assert.match(page, /No customers match your search\./);
  assert.match(page, /disabled=\{page >= pageCount\}/);
  assert.doesNotMatch(page, /\.slice\(/);
  assert.doesNotMatch(page, /returned customers/);
});
