import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("./AdminPortal.jsx", import.meta.url), "utf8");

test("onboarding success keeps working while join-poster generation is asynchronous", () => {
  assert.match(source, /Café merchant created/);
  assert.match(source, /initialReadiness=\{normalizedCreated\.onboardingSummary\} showReadiness/);
  assert.match(source, /Your poster is being created automatically\./);
  assert.match(source, /window\.setTimeout\(poll, 3500\)/);
  assert.match(source, /wallet-readiness/);
  assert.match(source, /return \(\) => \{ active = false; window\.clearTimeout\(timeoutId\); \}/);
});

test("generated-assets UI covers generating, ready, failed, preview, downloads, and regeneration", () => {
  for (const label of ["Generating", "Ready", "Failed", "Preview", "Download PDF", "Download PNG", "Regenerate", "Retry"]) assert.match(source, new RegExp(label));
  assert.match(source, /assets\/\$\{group\.key\}/);
  assert.match(source, /sales_sheet_pdf/);
  assert.match(source, /sales_sheet_png/);
  assert.match(source, /Sales \/ overview sheet/);
  assert.match(source, /assets\/\$\{asset\.id\}\/url/);
  assert.match(source, /generation failed\. Try again\./);
  assert.match(source, /Launch Materials/);
  assert.doesNotMatch(source, />Generated assets</);
  assert.match(source, /group\.ready \|\| group\.failed \? <button/);
});

test("café detail exposes a minimal Assets tab using admin-scoped backend endpoints", () => {
  assert.match(source, /\["assets", "Assets"\]/);
  assert.match(source, /activeDetailTab === "assets"/);
  assert.match(source, /api\/admin\/merchants\/\$\{merchantId\}\/assets/);
});
