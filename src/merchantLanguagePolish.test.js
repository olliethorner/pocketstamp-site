import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("merchant dashboard uses customer-focused provider-neutral language", () => {
  const overview = read("merchant/pages/MerchantOverview.jsx");
  const customers = read("merchant/utils/customerData.js");
  const activity = read("merchant/utils/activityData.js");

  assert.match(overview, /label="Loyalty customers"/);
  assert.match(overview, /helper=.*"All time"/);
  assert.doesNotMatch(overview, /Active Wallet cards|customers joined|Recorded redemptions/);
  assert.doesNotMatch(customers, /Apple Wallet card|Wallet customer/);
  assert.doesNotMatch(activity, /Apple Wallet card|Wallet reminder/);
});

test("merchant join and marketing guidance includes both wallets without technical copy", () => {
  const join = read("merchant/pages/MerchantGetCustomers.jsx");
  const marketing = read("merchant/pages/MerchantMarketing.jsx");

  assert.match(join, /Add to Apple Wallet or Google Wallet/);
  assert.match(marketing, /for your loyalty customers/);
  assert.doesNotMatch(marketing, /Apple Wallet customers|Notification Overview|Recorded redemptions/);
});
