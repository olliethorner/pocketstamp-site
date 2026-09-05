import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const walletSource = readFileSync(
  new URL("./marketing/WalletVisuals.jsx", import.meta.url),
  "utf8",
).replace(/\s+/g, " ");
const indexSource = readFileSync(
  new URL("../index.html", import.meta.url),
  "utf8",
);
const homepageSource = readFileSync(
  new URL("./marketing/MarketingHomepage.jsx", import.meta.url),
  "utf8",
).replace(/\s+/g, " ");

test("public homepage positions PocketStamp for Apple Wallet and Google Wallet without an app", () => {
  assert.match(homepageSource, /Wallet loyalty for independent cafés/);
  assert.match(
    homepageSource,
    /branded loyalty card in Apple Wallet or Google Wallet/,
  );
  assert.match(homepageSource, /Apple Wallet \+ Google Wallet/);
});

test("public customer journey covers joining, both Wallets, scanning, and automatic updates", () => {
  assert.match(walletSource, /Full name/);
  assert.match(walletSource, /Email address/);
  assert.match(walletSource, /Apple Wallet or Google Wallet/);
  assert.match(
    walletSource,
    /PocketStamp records the visit and updates their progress/,
  );
  assert.match(homepageSource, /Updates as stamps are collected/);
});

test("default metadata describes both supported Wallet platforms", () => {
  assert.match(indexSource, /Wallet Loyalty That Works Alongside Your POS/);
  assert.match(
    indexSource,
    /Digital café loyalty in Apple Wallet and Google Wallet/,
  );
});
