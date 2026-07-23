import assert from "node:assert/strict";
import test from "node:test";
import {
  isMerchantScannerPath,
  isMerchantSetupPath,
  resolveMerchantManagementPage,
} from "./merchant/merchantRoutes.js";

test("resolves every supported merchant management route", () => {
  assert.equal(resolveMerchantManagementPage("/merchant"), "overview");
  assert.equal(resolveMerchantManagementPage("/merchant/"), "overview");
  assert.equal(resolveMerchantManagementPage("/merchant/customers"), "customers");
  assert.equal(resolveMerchantManagementPage("/merchant/activity"), "activity");
  assert.equal(resolveMerchantManagementPage("/merchant/marketing"), "marketing");
  assert.equal(resolveMerchantManagementPage("/merchant/get-customers"), "get-customers");
});

test("does not silently resolve unsupported merchant paths", () => {
  assert.equal(resolveMerchantManagementPage("/merchant/unknown"), null);
  assert.equal(resolveMerchantManagementPage("/merchant/customers/extra"), null);
});

test("keeps merchant setup and scanner routes separate", () => {
  assert.equal(isMerchantSetupPath("/merchant/setup"), true);
  assert.equal(isMerchantScannerPath("/merchant/scanner"), true);
  assert.equal(resolveMerchantManagementPage("/merchant/setup"), null);
  assert.equal(resolveMerchantManagementPage("/merchant/scanner"), null);
});
