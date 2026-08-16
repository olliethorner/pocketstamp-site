import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { shouldPollWalletReadiness, walletReadinessRows } from "./adminOnboardingStatus.js";

const source = fs.readFileSync(new URL("./AdminPortal.jsx", import.meta.url), "utf8");
const apple = { state: "ready", tone: "green", status: "Ready", message: "Apple Wallet is ready." };
const google = {
  ready: { state: "ready", tone: "green", status: "Ready", message: "Google Wallet is ready.", reason: null },
  preparing: { state: "preparing", tone: "amber", status: "Preparing", message: "Google Wallet is being configured automatically.", reason: "This usually completes shortly." },
  pending_review: { state: "pending_review", tone: "amber", status: "Pending review", message: "Google Wallet is waiting for Google approval.", reason: "PocketStamp will update this automatically when approval completes." },
  needs_attention: { state: "needs_attention", tone: "red", status: "Needs attention", message: "Google Wallet setup needs attention.", reason: "Retry setup or review the merchant configuration." },
};
const readiness = (state) => ({ wallets: { apple, google: google[state] } });

test("Wallet readiness presents Apple Ready and every bounded Google state", () => {
  for (const state of Object.keys(google)) {
    const rows = walletReadinessRows(readiness(state));
    assert.deepEqual(rows[0], ["Apple Wallet", { tone: "green", status: "Ready", message: "Apple Wallet is ready.", reason: undefined }]);
    assert.deepEqual(rows[1], ["Google Wallet", { tone: google[state].tone, status: google[state].status, message: google[state].message, reason: google[state].reason }]);
  }
});

test("only Preparing continues Wallet readiness polling", () => {
  assert.equal(shouldPollWalletReadiness(readiness("preparing")), true);
  for (const state of ["ready", "pending_review", "needs_attention"]) assert.equal(shouldPollWalletReadiness(readiness(state)), false);
});

test("Overview has bounded loading and retryable error states", () => {
  assert.match(source, /Checking Wallet readiness…/);
  assert.match(source, /Wallet readiness could not be checked right now\./);
  assert.match(source, />Retry<\/button>/);
});

test("Overview loads the current scoped endpoint and uses one bounded timer lifecycle", () => {
  assert.match(source, /`\/api\/admin\/merchants\/\$\{merchantId\}\/wallet-readiness`/);
  assert.match(source, /shouldPollWalletReadiness\(payload\.readiness\).*window\.setTimeout\(check, 3500\)/s);
  assert.match(source, /active = false; window\.clearTimeout\(timeoutId\)/);
  assert.doesNotMatch(source, /setInterval\(/);
});

test("merchant changes remount readiness and raw provider fields are discarded", () => {
  assert.match(source, /<CurrentWalletReadiness key=\{merchantId\} merchantId=\{merchantId\}/);
  const rows = walletReadinessRows({ wallets: { google: { ...google.ready, providerError: "private", code: "SECRET" } } });
  assert.doesNotMatch(JSON.stringify(rows), /private|SECRET|providerError|code/);
});
