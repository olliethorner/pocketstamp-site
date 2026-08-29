import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
const appStyles = readFileSync(new URL("./App.css", import.meta.url), "utf8");
const vercelConfig = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

test("homepage includes the existing-POS proposition and download navigation", () => {
  assert.match(appSource, /Digital loyalty, without changing how you run your café/);
  assert.match(appSource, /id="existing-pos"/);
  assert.match(appSource, /href="\/download"/);
});

test("homepage excludes the removed FAQ and café pilot sections", () => {
  assert.doesNotMatch(appSource, /Frequently asked questions/);
  assert.doesNotMatch(appSource, /Early café offer/);
  assert.doesNotMatch(appSource, /Pilot package/);
  assert.doesNotMatch(appSource, /href="#pilot"/);
});

test("homepage excludes the retired no-app manifesto section and its exclusive styles", () => {
  assert.doesNotMatch(appSource, /No forgotten stamp cards/);
  assert.doesNotMatch(appSource, /A loyalty experience that stays with your customer/);
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
