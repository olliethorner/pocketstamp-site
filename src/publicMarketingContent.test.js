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
  assert.match(homepageSource, /Digital loyalty cards for Apple Wallet and Google Wallet/);
  assert.match(homepageSource, /card to Apple Wallet or Google Wallet — no app required/);
  assert.match(homepageSource, /iPhone \+ Android/);
});

test("public customer journey covers joining, both Wallets, scanning, and automatic updates", () => {
  assert.match(appSource, /\["Enter details"/);
  assert.match(appSource, /add the loyalty card to Apple Wallet or Google Wallet/);
  assert.match(appSource, /\[\s*"Wallet updates automatically"/);
  assert.match(homepageSource, /Apple Wallet and Google Wallet customers scan the same loyalty card/);
});

test("Android FAQ and default metadata describe both supported platforms", () => {
  assert.match(homepageSource, /Does PocketStamp work on Android\?/);
  assert.match(homepageSource, /Google Wallet on Android and Apple Wallet on iPhone/);
  assert.match(homepageSource, /do not need to download a separate PocketStamp app/);
  assert.match(indexSource, /Apple Wallet and Google Wallet Loyalty for Cafés/);
  assert.match(indexSource, /Digital café loyalty cards for Apple Wallet and Google Wallet/);
});
