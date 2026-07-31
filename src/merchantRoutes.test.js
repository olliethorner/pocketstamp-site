import assert from "node:assert/strict";
import test from "node:test";
import {
  isMerchantScannerPath,
  isMerchantSetupPath,
  resolveMerchantManagementNavigation,
  resolveMerchantManagementPage,
  resolveSafeMerchantReturnTo,
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

test("resolves same-origin management links for client-side navigation", () => {
  assert.deepEqual(
    resolveMerchantManagementNavigation(
      "/merchant/customers",
      "https://getpocketstamp.com",
    ),
    { href: "/merchant/customers", page: "customers" },
  );
  assert.deepEqual(
    resolveMerchantManagementNavigation(
      "https://getpocketstamp.com/merchant/activity",
      "https://getpocketstamp.com",
    ),
    { href: "/merchant/activity", page: "activity" },
  );
});

test("leaves standalone, unsupported, and external links to the browser", () => {
  const origin = "https://getpocketstamp.com";

  assert.equal(
    resolveMerchantManagementNavigation("/merchant/setup", origin),
    null,
  );
  assert.equal(
    resolveMerchantManagementNavigation(
      "/merchant/scanner?deviceToken=test",
      origin,
    ),
    null,
  );
  assert.equal(
    resolveMerchantManagementNavigation("/merchant/unknown", origin),
    null,
  );
  assert.equal(
    resolveMerchantManagementNavigation(
      "https://example.com/merchant/customers",
      origin,
    ),
    null,
  );
});

test("preserves only safe merchant return destinations", () => {
  const origin = "https://getpocketstamp.com";

  assert.deepEqual(
    resolveSafeMerchantReturnTo("/merchant/marketing", origin),
    { href: "/merchant/marketing", page: "marketing" },
  );
  assert.deepEqual(
    resolveSafeMerchantReturnTo("https://example.com/merchant/marketing", origin),
    { href: "/merchant", page: "overview" },
  );
  assert.deepEqual(
    resolveSafeMerchantReturnTo("not a valid merchant destination", origin),
    { href: "/merchant", page: "overview" },
  );
});
