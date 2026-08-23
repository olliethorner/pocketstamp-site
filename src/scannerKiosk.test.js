import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("./main.jsx", import.meta.url), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("../public/scanner.webmanifest", import.meta.url), "utf8"));

test("hardware scanner capture is non-editable and suppresses the Android virtual keyboard", () => {
  const capture = source.slice(source.indexOf('<div\n        ref={inputRef}'), source.indexOf("{isCameraOpen ?"));
  assert.match(capture, /tabIndex="-1"/);
  assert.match(capture, /inputMode="none"/);
  assert.match(capture, /virtualkeyboardpolicy="manual"/);
  assert.doesNotMatch(capture, /<input|onChange|value=/);
  assert.match(source, /navigator\.virtualKeyboard\?\.hide[\s\S]*navigator\.virtualKeyboard\.hide\(\)/);
});

test("manual and camera modes yield capture focus and restore scanner readiness on close", () => {
  assert.match(source, /scannerCaptureEnabledRef\.current = !isCameraOpen && !isManualOpen && !adjustment\.isOpen/);
  assert.match(source, /if \(isManualOpen\) window\.setTimeout\(\(\) => manualInputRef\.current\?\.focus/);
  assert.match(source, /function closeCamera\(\)[\s\S]*setIsCameraOpen\(false\);[\s\S]*focusScannerInput\(\)/);
  assert.match(source, /function closeCamera\(\)[\s\S]*setScanStatus\("idle"\)/);
  assert.match(source, /function closeAdjustment\(\)[\s\S]*setScanStatus\("idle"\)/);
  assert.match(source, /inputRef\.current\?\.blur\(\);[\s\S]*setIsCameraOpen\(true\)/);
});

test("normal successes schedule ready while reward decisions have no automatic timeout", () => {
  assert.match(source, /if \(nextStatus !== "reward_ready"\) scheduleReady\(nextStatus === "stamp_added" \? 3200 : 5200\)/);
  assert.equal((source.match(/if \(!payload\?\.rewardReady\) scheduleReady\(3600\)/g) || []).length, 2);
  assert.doesNotMatch(source, /scheduleReady\([^\n]*reward_ready|rewardReady \? \d+ :/);
});

test("scanner focus recovers without polling after lifecycle and display changes", () => {
  for (const event of ["focus", "pageshow", "orientationchange", "visibilitychange", "fullscreenchange"]) {
    assert.match(source, new RegExp(`addEventListener\\(\\"${event}\\"`));
  }
  assert.doesNotMatch(source, /setInterval/);
});

test("Scanner Mode is an installed fullscreen PWA with a user-activated browser fallback", () => {
  assert.equal(manifest.id, "/merchant/scanner");
  assert.equal(manifest.scope, "/merchant/scanner");
  assert.equal(manifest.display, "fullscreen");
  assert.deepEqual(manifest.display_override, ["fullscreen", "standalone"]);
  assert.deepEqual(manifest.icons.map(({ sizes }) => sizes), ["192x192", "512x512"]);
  assert.match(main, /serviceWorker\.register\('\/scanner-sw\.js', \{ scope: '\/merchant\/scanner' \}\)/);
  assert.match(source, /requestFullscreen\(\{ navigationUI: "hide" \}\)/);
  assert.match(source, />\s*Enter fullscreen\s*</);
});
