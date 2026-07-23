import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMerchantJoinUrl,
  getJoinAvailability,
} from "./merchant/utils/joinUrl.js";

test("reliable merchant slug produces the exact public join URL", () => {
  assert.equal(
    buildMerchantJoinUrl("pocket-stamp-cafe"),
    "https://getpocketstamp.com/join/pocket-stamp-cafe",
  );
});

test("missing slug never generates a join URL", () => {
  assert.equal(buildMerchantJoinUrl(""), "");
  assert.equal(buildMerchantJoinUrl(null), "");
  assert.equal(buildMerchantJoinUrl(undefined), "");
});

test("merchant name or ID are not accepted as fallback inputs", () => {
  const merchant = { merchantName: "Fallback Cafe", merchantId: "merchant_1" };
  assert.equal(buildMerchantJoinUrl(merchant.merchantSlug), "");
});

test("QR and copy/open actions share join URL availability", () => {
  assert.deepEqual(getJoinAvailability("https://getpocketstamp.com/join/cafe"), {
    hasJoinUrl: true,
    showQr: true,
    showActions: true,
  });
  assert.deepEqual(getJoinAvailability(""), {
    hasJoinUrl: false,
    showQr: false,
    showActions: false,
  });
});
