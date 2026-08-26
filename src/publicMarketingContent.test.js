import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const homepageSource = appSource.slice(
  appSource.indexOf("function MarketingHomepage()"),
  appSource.indexOf("function extractScannerDevice"),
);

test("public homepage positions PocketStamp for Apple Wallet and Google Wallet without an app", () => {
  assert.match(homepageSource, /Wallet loyalty for independent cafés/);
  assert.match(homepageSource, /branded loyalty card in Apple Wallet or Google Wallet/);
  assert.match(homepageSource, /Apple \+ Google Wallet/);
});

test("public customer journey covers joining, both Wallets, scanning, and automatic updates", () => {
  assert.match(appSource, /\["Enter details"/);
  assert.match(appSource, /add the loyalty card to Apple Wallet or Google Wallet/);
  assert.match(appSource, /\[\s*"Wallet updates automatically"/);
  assert.match(appSource, /Customers scan their Apple Wallet or Google Wallet loyalty card/);
});

test("default metadata describes both supported Wallet platforms", () => {
  assert.match(indexSource, /Wallet Loyalty That Works Alongside Your POS/);
  assert.match(indexSource, /Digital café loyalty in Apple Wallet and Google Wallet/);
});
