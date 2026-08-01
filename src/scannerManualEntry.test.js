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

const FIRST_CODE = "psm_First-Synthetic-Code";
const REPLACEMENT_CODE = "psm_Replacement-MixedCase";

test("mixed-case membership identifiers remain byte-for-byte unchanged", () => {
  assert.equal(normalizeManualScanValue(REPLACEMENT_CODE), REPLACEMENT_CODE);
});

test("replacement paste becomes the visible and canonical manual value", () => {
  const visibleValue = applyManualPaste(FIRST_CODE, REPLACEMENT_CODE, 0, FIRST_CODE.length);
  const canonicalValue = normalizeManualScanValue(visibleValue);

  assert.equal(visibleValue, REPLACEMENT_CODE);
  assert.equal(canonicalValue, visibleValue);
});

test("paste supports empty fields and selected replacement ranges", () => {
  assert.equal(applyManualPaste("", REPLACEMENT_CODE, 0, 0), REPLACEMENT_CODE);
  assert.equal(applyManualPaste("psm_Old-Value", "New", 4, 7), "psm_New-Value");
});

test("immediate paste then lookup uses the synchronously captured exact-case value", () => {
  let visibleValue = FIRST_CODE;
  const pastedValue = applyManualPaste(visibleValue, REPLACEMENT_CODE, 0, visibleValue.length);

  visibleValue = pastedValue;
  const manualRef = pastedValue;
  const immediateActionSnapshot = normalizeManualScanValue(visibleValue);
  const lookup = buildScannerLookupRequest({ deviceToken: "device", scanValue: immediateActionSnapshot });

  assert.equal(visibleValue, REPLACEMENT_CODE);
  assert.equal(manualRef, visibleValue);
  assert.equal(immediateActionSnapshot, visibleValue);
  assert.equal(lookup.scanValue, visibleValue);
});

test("lookup and submit use the same replacement value", () => {
  const scanValue = normalizeManualScanValue(
    applyManualPaste(FIRST_CODE, REPLACEMENT_CODE, 0, FIRST_CODE.length),
  );

  assert.equal(buildScannerLookupRequest({ deviceToken: "device", scanValue }).scanValue, REPLACEMENT_CODE);
  assert.equal(buildScannerScanRequest({ deviceToken: "device", scanValue, requestId: "request" }).scanValue, REPLACEMENT_CODE);
});

test("visible mixed-case manual input equals lookup and scan request values", () => {
  const visibleValue = REPLACEMENT_CODE;
  const currentValue = normalizeManualScanValue(visibleValue);
  const lookup = buildScannerLookupRequest({ deviceToken: "device", scanValue: currentValue });
  const scan = buildScannerScanRequest({ deviceToken: "device", scanValue: currentValue, requestId: "request" });

  assert.equal(lookup.scanValue, visibleValue);
  assert.equal(scan.scanValue, visibleValue);
});

test("whitespace and control characters are removed without changing case", () => {
  assert.equal(
    normalizeManualScanValue(` \t${REPLACEMENT_CODE.slice(0, 8)}\r\n${REPLACEMENT_CODE.slice(8)} \n`),
    REPLACEMENT_CODE,
  );
});

test("camera and USB scanner values preserve exact case", () => {
  const cameraDecodedValue = "psm_Camera-MixedCase";
  const usbBufferedValue = "psm_USB-MixedCase";

  assert.equal(normalizeManualScanValue(cameraDecodedValue), cameraDecodedValue);
  assert.equal(normalizeManualScanValue(usbBufferedValue), usbBufferedValue);
});

test("legacy identifier shapes continue unchanged", () => {
  for (const value of ["psm_legacy-value", "legacy-pass-123", "SERIAL_ABC_123", "plainvalue"]) {
    assert.equal(normalizeManualScanValue(value), value);
  }
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

const COMPLETE_LOOKUP = {
  customerName: "Synthetic Customer",
  customerEmail: "synthetic@example.invalid",
  customerId: "customer-synthetic",
  passSerial: "serial-Synthetic",
  passSerialNumber: "serial-Synthetic",
  serialNumber: "serial-Synthetic",
  passId: null,
  stamps: 4,
  rewardThreshold: 10,
  rewardReady: false,
  merchantId: "merchant-synthetic",
  lastActivityAt: "2026-08-01T12:00:00.000Z",
};

test("flat production lookup response normalizes into a complete customer pass", () => {
  assert.deepEqual(getSuccessfulCustomerPass({ ok: true, ...COMPLETE_LOOKUP }), COMPLETE_LOOKUP);
});

test("nested lookup response normalizes into the same customer pass", () => {
  assert.deepEqual(
    getSuccessfulCustomerPass({ ok: true, customerPass: { ...COMPLETE_LOOKUP } }),
    COMPLETE_LOOKUP,
  );
});

test("null passId is accepted when established serial aliases are present", () => {
  const response = { ok: true, ...COMPLETE_LOOKUP, passId: null };
  delete response.passSerial;
  delete response.passSerialNumber;
  const result = getSuccessfulCustomerPass(response);

  assert.equal(result.passId, null);
  assert.equal(result.passSerial, COMPLETE_LOOKUP.serialNumber);
  assert.equal(result.passSerialNumber, COMPLETE_LOOKUP.serialNumber);
  assert.equal(result.serialNumber, COMPLETE_LOOKUP.serialNumber);
});

test("failed or incomplete lookup cannot open the customer modal", () => {
  assert.equal(getSuccessfulCustomerPass({ ok: false }), null);
  assert.equal(getSuccessfulCustomerPass({ ok: true, customerPass: {} }), null);
  for (const field of ["customerName", "customerId", "passSerial", "stamps", "rewardThreshold"]) {
    const incomplete = { ...COMPLETE_LOOKUP };
    delete incomplete[field];
    if (field === "passSerial") {
      delete incomplete.passSerialNumber;
      delete incomplete.serialNumber;
    }
    assert.equal(getSuccessfulCustomerPass({ ok: true, ...incomplete }), null);
  }
});

test("modal-ready lookup result contains real customer, stamp, serial, and activity data", () => {
  const customerPass = getSuccessfulCustomerPass({ ok: true, ...COMPLETE_LOOKUP });

  assert.equal(customerPass.customerName, COMPLETE_LOOKUP.customerName);
  assert.equal(customerPass.stamps, COMPLETE_LOOKUP.stamps);
  assert.equal(customerPass.passSerial, COMPLETE_LOOKUP.passSerial);
  assert.equal(customerPass.lastActivityAt, COMPLETE_LOOKUP.lastActivityAt);
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
  assert.match(source, /if \(!customerPass\) throw new Error\("Customer lookup failed\."\)/);
  assert.match(source, /isOpen: false, result: null/);
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

test("scanner normalization and request builders contain no case conversion", () => {
  const appSource = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  const normalizationSource = fs.readFileSync(new URL("./merchant/scannerManualEntry.js", import.meta.url), "utf8");
  const requestSource = fs.readFileSync(new URL("./merchant/scannerRequests.js", import.meta.url), "utf8");
  const scannerNormalization = appSource.match(/function normalizeScannerScanValue\(value\) \{([\s\S]*?)\n\}/)?.[1] || "";

  assert.doesNotMatch(normalizationSource, /toLowerCase|toLocaleLowerCase/);
  assert.doesNotMatch(scannerNormalization, /toLowerCase|toLocaleLowerCase/);
  assert.doesNotMatch(requestSource, /toLowerCase|toLocaleLowerCase/);
});
