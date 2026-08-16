import test from "node:test";
import assert from "node:assert/strict";
import { generatedAssetGroupState, shouldPollOnboardingStatus } from "./adminOnboardingStatus.js";

const types = ["join_poster_pdf", "join_poster_png"];
const pair = (status, prefix = "join_poster") => ["pdf", "png"].map((format) => ({ assetType: `${prefix}_${format}`, status }));
const readiness = (state) => ({ wallets: { google: { state } } });

test("generated asset groups keep ready, failed, and generating states independent", () => {
  assert.equal(generatedAssetGroupState(pair("ready"), types), "ready");
  assert.equal(generatedAssetGroupState([{ assetType: "join_poster_pdf", status: "failed" }], types), "failed");
  assert.equal(generatedAssetGroupState(pair("pending"), types), "generating");
});

test("polling continues for Google or either asset group while preparing", () => {
  const readyAssets = [...pair("ready"), ...pair("ready", "sales_sheet")];
  assert.equal(shouldPollOnboardingStatus({ readiness: readiness("preparing"), assets: readyAssets }), true);
  assert.equal(shouldPollOnboardingStatus({ readiness: readiness("ready"), assets: [...pair("pending"), ...pair("ready", "sales_sheet")] }), true);
});

test("polling stops only when Google and both asset groups are terminal", () => {
  for (const google of ["ready", "pending_review", "needs_attention"]) {
    assert.equal(shouldPollOnboardingStatus({ readiness: readiness(google), assets: [...pair("ready"), ...pair("failed", "sales_sheet")] }), false);
  }
});

test("a scheduling failure stops missing work without hiding already queued work", () => {
  assert.equal(shouldPollOnboardingStatus({ readiness: readiness("ready"), assets: [], scheduleState: "failed_to_schedule" }), false);
  assert.equal(shouldPollOnboardingStatus({ readiness: readiness("ready"), assets: pair("pending"), scheduleState: "failed_to_schedule" }), true);
});

test("source uses one timeout lifecycle, cleans up, and hides regeneration while generating", async () => {
  const fs = await import("node:fs"); const source = fs.readFileSync(new URL("./AdminPortal.jsx", import.meta.url), "utf8");
  assert.match(source, /Promise\.all\(\[/); assert.match(source, /window\.clearTimeout\(timeoutId\)/);
  assert.doesNotMatch(source, /setInterval\(/); assert.match(source, /group\.ready \|\| group\.failed \? <button/);
  assert.match(source, /Your sales sheet is being created automatically\./);
});
