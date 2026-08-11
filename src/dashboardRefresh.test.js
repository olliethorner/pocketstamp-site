import assert from "node:assert/strict";
import test from "node:test";
import { getMerchantPageDatasets } from "./merchant/utils/dashboardRefresh.js";

test("selects only datasets required by each merchant page", () => {
  assert.deepEqual(getMerchantPageDatasets("overview"), ["dashboard"]);
  assert.deepEqual(getMerchantPageDatasets("activity"), ["activity"]);
  assert.deepEqual(getMerchantPageDatasets("customers"), ["customers"]);
  assert.deepEqual(getMerchantPageDatasets("marketing"), ["dashboard", "campaigns"]);
  assert.deepEqual(getMerchantPageDatasets("get-customers"), []);
});

test("unsupported pages do not trigger merchant datasets", () => {
  assert.deepEqual(getMerchantPageDatasets("unknown"), []);
  assert.deepEqual(getMerchantPageDatasets(null), []);
});
