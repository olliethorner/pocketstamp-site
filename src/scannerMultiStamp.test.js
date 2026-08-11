import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

test("recent activity keeps compact and separate quick-add and Adjust actions", () => {
  assert.match(source, /index === 0 && getQuickExtraStampTarget\(item, rewardThreshold\)/);
  assert.match(source, /"\+1 more"/);
  assert.match(source, />\s*Adjust\s*</);
  assert.match(source, /className="flex items-center justify-end gap-2"/);
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
