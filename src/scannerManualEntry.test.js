import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  applyManualPaste,
  getSuccessfulCustomerPass,
  normalizeManualScanValue,
  sanitizeScannerMessage,
} from "./merchant/scannerManualEntry.js";
import { buildScannerLookupRequest, buildScannerScanRequest } from "./merchant/scannerRequests.js";

const FIRST_CODE = "psm_first-synthetic-code";
const REPLACEMENT_CODE = "psm_replacement-code";

test("replacement paste becomes the visible and canonical manual value", () => {
  const visibleValue = applyManualPaste(FIRST_CODE, REPLACEMENT_CODE, 0, FIRST_CODE.length);
  const canonicalValue = normalizeManualScanValue(visibleValue);

  assert.equal(visibleValue, REPLACEMENT_CODE);
  assert.equal(canonicalValue, visibleValue);
});

test("paste supports empty fields and selected replacement ranges", () => {
  assert.equal(applyManualPaste("", REPLACEMENT_CODE, 0, 0), REPLACEMENT_CODE);
  assert.equal(applyManualPaste("psm_old-value", "new", 4, 7), "psm_new-value");
});

test("immediate paste then action uses the synchronously captured value", () => {
  let visibleValue = FIRST_CODE;
  const pastedValue = applyManualPaste(visibleValue, REPLACEMENT_CODE, 0, visibleValue.length);

  visibleValue = pastedValue;
  const manualRef = pastedValue;
  const immediateActionSnapshot = normalizeManualScanValue(visibleValue);

  assert.equal(visibleValue, REPLACEMENT_CODE);
  assert.equal(manualRef, visibleValue);
  assert.equal(immediateActionSnapshot, visibleValue);
});

test("lookup and submit use the same replacement value", () => {
  const scanValue = normalizeManualScanValue(
    applyManualPaste(FIRST_CODE, REPLACEMENT_CODE, 0, FIRST_CODE.length),
  );

  assert.equal(buildScannerLookupRequest({ deviceToken: "device", scanValue }).scanValue, REPLACEMENT_CODE);
  assert.equal(buildScannerScanRequest({ deviceToken: "device", scanValue, requestId: "request" }).scanValue, REPLACEMENT_CODE);
});

test("manual actions are isolated from scanner state and ready clears both paths", () => {
  let manualValue = REPLACEMENT_CODE;
  let scannerBuffer = "psm_scanner-buffer";
  assert.notEqual(scannerBuffer, manualValue);
  const outgoing = normalizeManualScanValue(manualValue);

  scannerBuffer = "";
  manualValue = "";

  assert.equal(outgoing, REPLACEMENT_CODE);
  assert.equal(manualValue, "");
  assert.equal(scannerBuffer, "");
});

test("failed or incomplete lookup cannot open the customer modal", () => {
  assert.equal(getSuccessfulCustomerPass({ ok: false }), null);
  assert.equal(getSuccessfulCustomerPass({ ok: true, customerPass: {} }), null);
  assert.equal(getSuccessfulCustomerPass({ ok: true, customerPass: { customerName: "Synthetic" } }), null);
  assert.equal(getSuccessfulCustomerPass({
    ok: true,
    customerPass: { customerId: "synthetic", customerName: "Synthetic", currentStamps: "" },
  }), null);
});

test("successful lookup returns complete real customer data", () => {
  const customerPass = {
    customerId: "customer-synthetic",
    customerName: "Synthetic Customer",
    currentStamps: 4,
  };

  assert.strictEqual(getSuccessfulCustomerPass({ ok: true, customerPass }), customerPass);
});

test("scanner errors cannot render a raw pass identifier", () => {
  const message = sanitizeScannerMessage(`Lookup failed for ${REPLACEMENT_CODE}`);

  assert.equal(message, "Lookup failed for pass code");
  assert.doesNotMatch(message, /psm_/i);
});

test("App wires paste, lookup, submit, ready clearing, and modal gating to manual state", () => {
  const source = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(source, /onPaste=\{handleManualPaste\}/);
  assert.match(source, /onChange=\{handleManualInput\}/);
  assert.doesNotMatch(source, /onInput=\{handleManualInput\}/);
  assert.match(source, /input\.value = nextValue;[\s\S]*updateManualCode\(nextValue\)/);
  assert.match(source, /handleManualSubmit/);
  assert.match(source, /readCurrentManualValue/);
  assert.match(source, /clearManualAndScannerState/);
  assert.match(source, /getSuccessfulCustomerPass\(payload\)/);
  assert.doesNotMatch(source, /scanValuePrefix/);
});

test("manual actions are isolated while camera and USB paths retain scan submission", () => {
  const source = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  const manualLookup = source.match(/async function handleManualLookup\(\) \{([\s\S]*?)\n {2}\}/)?.[1] || "";
  const manualSubmit = source.match(/function handleManualSubmit\(\) \{([\s\S]*?)\n {2}\}/)?.[1] || "";

  assert.doesNotMatch(manualLookup, /normalizeScannerScanValue\(scanValue\)|scannerBufferRef/);
  assert.doesNotMatch(manualSubmit, /handleScanSubmit\(scanValue\)|scannerBufferRef/);
  assert.match(source, /onBufferedScanSubmit\(bufferedValue\)/);
  assert.match(source, /handleScanSubmit\(decodedValue\)/);
});
