import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

test("Reward Ready is a blocking state with only redeem and cancel exits", () => {
  assert.match(source, /const rewardDecisionPending = scanStatus === "reward_ready"/);
  assert.match(source, /if \(nextStatus !== "reward_ready"\) scheduleReady/);
  assert.match(source, /displayStatus === "reward_ready"[\s\S]*Redeem reward[\s\S]*Cancel \/ Back to ready/);
  assert.doesNotMatch(source, /scheduleReady\([^\n]*reward_ready|rewardReady \? \d+ :/);
});

test("scanner, camera, and manual intake are blocked while a reward decision is pending", () => {
  assert.match(source, /function handleGlobalScannerKeyDown\(event\) \{[\s\S]*scanStatus === "reward_ready"[\s\S]*clearGlobalScannerBuffer\(\);[\s\S]*return;/);
  assert.match(source, /function handleScanSubmit[\s\S]*if \(rewardDecisionPending\)[\s\S]*return;/);
  assert.match(source, /function handleCameraDetected[\s\S]*isProcessing \|\| rewardDecisionPending/);
  assert.match(source, /function handleManualSubmit\(\) \{[\s\S]*if \(rewardDecisionPending\) return;/);
  assert.match(source, /function handleManualLookup\(\) \{[\s\S]*if \(rewardDecisionPending\) return;/);
  assert.match(source, /function toggleManualEntry\(\) \{[\s\S]*if \(rewardDecisionPending\) return;/);
  assert.match(source, /async function openAdjustment[\s\S]*if \(rewardDecisionPending\) return;/);
  assert.match(source, /async function addQuickExtraStamp[\s\S]*if \(rewardDecisionPending\) return;/);
  assert.match(source, /Scan with tablet camera[\s\S]*disabled=\{isProcessing \|\| rewardDecisionPending\}/);
  assert.doesNotMatch(source, /\["stamp_added", "already_stamped_recently", "reward_ready", "reward_redeemed"\]/);
});

test("cancel performs no redemption and restores ready capture", () => {
  const rewardActions = source.slice(source.indexOf('{displayStatus === "reward_ready"'), source.indexOf('{displayStatus === "scan_error"'));
  const cancel = rewardActions.slice(rewardActions.indexOf("Cancel / Back to ready") - 700);
  assert.match(cancel, /setScanStatus\("idle"\)/);
  assert.match(cancel, /setScanResult\(null\)/);
  assert.match(cancel, /clearManualAndScannerState\(\)/);
  assert.match(cancel, /focusScannerInput\(\)/);
  assert.doesNotMatch(cancel, /redeemScannerReward|submitScannerScan|adjustScannerStamps/);
});

test("successful redemption retains its existing automatic ready recovery", () => {
  const redeem = source.slice(source.indexOf("async function handleRedeemReward"), source.indexOf("async function handleUndoStamp"));
  assert.match(redeem, /redeemScannerReward/);
  assert.match(redeem, /setScanStatus\("reward_redeemed"\)/);
  assert.match(redeem, /scheduleReady\(3600\)/);
  assert.match(redeem, /focusScannerInput\(\)/);
});
