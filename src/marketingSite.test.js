import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
const appStyles = readFileSync(new URL("./App.css", import.meta.url), "utf8");
const homepageSource = readFileSync(
  new URL("./marketing/MarketingHomepage.jsx", import.meta.url),
  "utf8",
).replace(/\s+/g, " ");
const layoutSource = readFileSync(
  new URL("./marketing/MarketingLayout.jsx", import.meta.url),
  "utf8",
);
const vercelConfig = JSON.parse(
  readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
);

test("homepage includes the existing-POS proposition and download navigation", () => {
  assert.match(
    homepageSource,
    /Digital loyalty, without changing how you run your café/,
  );
  assert.match(homepageSource, /id="existing-pos"/);
  assert.match(layoutSource, /href="\/download"/);
});

test("homepage retains FAQ and introduces the complete software pricing offer", () => {
  assert.match(homepageSource, /id="faq"/);
  assert.match(homepageSource, /Simple café pricing/);
  assert.match(homepageSource, /All software features included/);
  assert.match(homepageSource, /href="\/pricing"/);
});

test("approved Wallet section retains no-app positioning without legacy manifesto styling", () => {
  assert.match(homepageSource, /No forgotten stamp cards/);
  assert.match(
    homepageSource,
    /A loyalty experience that stays with your customer/,
  );
  assert.doesNotMatch(appSource, /ps-manifesto/);
  assert.doesNotMatch(appStyles, /\.ps-manifesto/);
});

test("download page retains the production Scanner v1.1.1 asset", () => {
  assert.match(appSource, /function ScannerDownloadPage/);
  assert.match(appSource, /\/downloads\/PocketStamp-Scanner-v1\.1\.1\.apk/);
  assert.match(appSource, /Version 1\.1\.1/);
});

test("Vercel serves the download route without changing merchant and join rewrites", () => {
  const sources = vercelConfig.rewrites.map(({ source }) => source);
  assert.ok(sources.includes("/download"));
  assert.ok(sources.includes("/merchant/:path*"));
  assert.ok(sources.includes("/join/pocket-stamp-demo"));
  assert.ok(sources.some((source) => source.startsWith("/join/:merchantSlug")));
});
