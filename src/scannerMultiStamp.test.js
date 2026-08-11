import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

test("recent activity keeps compact and separate quick-add and Adjust actions", () => {
  assert.match(source, /index === 0 && getQuickExtraStampTarget\(item, rewardThreshold\)/);
  assert.match(source, /"\+1 more"/);
  assert.match(source, />\s*Adjust\s*</);
  assert.match(source, /className="ps-scanner-activity-actions flex items-center justify-end gap-1\.5"/);
});

test("Scanner Mode gives activity a wider overflow-safe landscape rail", () => {
  const css = fs.readFileSync(new URL("./App.css", import.meta.url), "utf8");
  assert.match(css, /grid-template-columns: minmax\(0, 64fr\) minmax\(22rem, 36fr\)/);
  assert.match(css, /\.ps-scanner-activity-row \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto/);
  assert.match(source, /getScannerActivityFirstName\(item\.customerName\)/);
  assert.match(source, /getScannerActivitySummary\(item\.type, item\.stampCount\)/);
  assert.doesNotMatch(source.slice(source.indexOf('className="ps-scanner-activity-row'), source.indexOf("activityLoadStatus")), /customerEmail|\.email/);
  assert.match(source, /Hold loyalty card under the scanner/);
});

test("Adjust opens immediately from safe row data while authoritative lookup gates saving", () => {
  assert.match(source, /setAdjustment\(\{[\s\S]*isOpen: true,[\s\S]*result: baseResult,[\s\S]*isLoading: true,[\s\S]*isReady: false/);
  assert.match(source, /lookupScannerPass\([\s\S]*isLoading: false,[\s\S]*isReady: true/);
  assert.match(source, /disabled=\{isSaving \|\| !isReady\}/);
  assert.match(source, /if \(!adjustment\.isReady \|\| adjustment\.isLoading/);
});

test("Adjust modal has one cancel, connected bounded controls, and quiet reference metadata", () => {
  const modalSource = source.slice(source.indexOf("function CustomerAdjustmentModal"), source.indexOf("function ScannerKioskPage"));
  assert.equal((modalSource.match(/>\s*Cancel\s*</g) || []).length, 1);
  assert.match(modalSource, /aria-label="Remove one stamp"/);
  assert.match(modalSource, /aria-label="Add one stamp"/);
  assert.match(modalSource, /Math\.max\(0, currentStamps - 1\)/);
  assert.match(modalSource, /Math\.min\(maxStamps, currentStamps \+ 1\)/);
  assert.match(modalSource, /Reference \{identifierValue\}/);
  assert.doesNotMatch(modalSource, /KioskStat label=\{identifierLabel\}/);
});

test("quick add reuses authoritative adjustment with audit reason and reward-ready handling", () => {
  assert.match(source, /adjustScannerStamps\(\{[\s\S]*stamps: targetStamps,[\s\S]*note: "Extra qualifying item"/);
  assert.match(source, /setScanStatus\(payload\?\.rewardReady \? "reward_ready" : "stamp_added"\)/);
  assert.match(source, /loadRecentActivity\(\)/);
  assert.match(source, /action: "stamp_adjusted"/);
});

test("manual entry behavior remains wired to its existing handlers", () => {
  assert.match(source, /onPaste={handleManualPaste}/);
  assert.match(source, /onClick={handleManualLookup}/);
  assert.match(source, /onSubmit=\{\(event\) => \{[\s\S]*handleManualSubmit\(\);/);
});
