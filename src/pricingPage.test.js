import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { pricing, annualSaving, hardwareFirstYear, vatQualifier, pricingFaqs, includedFeatures } from "./marketing/pricingContent.js";

test("approved offers retain the exact monthly, annual and hardware economics", () => {
  assert.equal(pricing.monthly, 49);
  assert.equal(pricing.annual, pricing.monthly * 11);
  assert.equal(annualSaving, 49);
  assert.equal(pricing.hardwareSetup, 299);
  assert.equal(pricing.hardwareMonths, 12);
  assert.equal(hardwareFirstYear, 887);
});

test("pricing content preserves provider qualifications without inventing commercial terms", () => {
  const copy = JSON.stringify({ pricingFaqs, includedFeatures });
  assert.match(copy, /per café/);
  assert.match(copy, /Apple Wallet customers where enabled/);
  assert.match(copy, /vary by provider and configuration/);
  assert.match(copy, /does not apply to PocketStamp \+ Hardware/);
  assert.doesNotMatch(copy, /unlimited|cancel anytime|money.back|warranty|incl\. VAT|\+ VAT|free trial/i);
  assert.equal(vatQualifier, "");
});

test("pricing is a public SPA route without changing existing backend routing", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.deepEqual(config.rewrites.filter(({ source }) => source === "/pricing"), [{ source: "/pricing", destination: "/index.html" }]);
  const app = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.match(app, /pathname === "\/pricing" \|\| pathname === "\/pricing\/"/);
});
