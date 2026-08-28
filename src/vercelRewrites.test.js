import assert from "node:assert/strict";
import fs from "node:fs";
import process from "node:process";
import test from "node:test";

import middleware, { config as middlewareConfig } from "../middleware.js";

const configuration = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const rewrites = configuration.rewrites;
const backend = "https://pocketstamp-wallet-backend-production.up.railway.app";

test("public Google save-link refresh is routed to the existing Railway endpoint", () => {
  assert.deepEqual(rewrites.filter(({ source }) => source.includes("google-save-link")), [{
    source: "/join/:merchantSlug((?!pocket-stamp-demo$)[^/]+)/google-save-link",
    destination: `${backend}/join/:merchantSlug/google-save-link`,
  }]);
});

test("existing public join rewrites remain exact", () => {
  assert.deepEqual(rewrites.filter(({ source }) => source.startsWith("/join/")), [
    { source: "/join/pocket-stamp-demo", destination: "/index.html" },
    { source: "/join/pocket-stamp-demo/success", destination: "/index.html" },
    {
      source: "/join/:merchantSlug((?!pocket-stamp-demo$)[^/]+)/google-save-link",
      destination: `${backend}/join/:merchantSlug/google-save-link`,
    },
    {
      source: "/join/:merchantSlug((?!pocket-stamp-demo$)[^/]+)/success",
      destination: `${backend}/join/:merchantSlug/success`,
    },
    {
      source: "/join/:merchantSlug((?!pocket-stamp-demo$)[^/]+)",
      destination: `${backend}/join/:merchantSlug`,
    },
  ]);
});

test("Scanner Mode APIs use the same-origin backend proxy required for HttpOnly sessions", () => {
  assert.deepEqual(rewrites.filter(({ source }) => source.startsWith("/api/merchant/scanner/")), [{
    source: "/api/merchant/scanner/:path*",
    destination: `${backend}/api/merchant/scanner/:path*`,
  }]);
});

test("all unrelated current-main rewrites remain unchanged", () => {
  assert.deepEqual(rewrites.filter(({ source }) =>
    !source.startsWith("/join/") && !source.startsWith("/api/merchant/scanner/")), [
    { source: "/demo/pocket-stamp-demo/create", destination: "/api/demo-pocket-stamp-demo-create" },
    { source: "/pass/:serial", destination: `${backend}/pass/:serial` },
    { source: "/legal/privacy", destination: "/index.html" },
    { source: "/legal/terms", destination: "/index.html" },
    { source: "/contact", destination: "/index.html" },
    { source: "/download", destination: "/index.html" },
    { source: "/dashboard-demo/:path*", destination: "/index.html" },
    { source: "/merchant", destination: "/index.html" },
    { source: "/merchant/:path*", destination: "/index.html" },
    { source: "/admin", destination: "/index.html" },
    { source: "/admin/:path*", destination: "/index.html" },
  ]);
  assert.deepEqual(Object.keys(configuration), ["headers", "rewrites"]);
});

test("Android download is served with an APK filename and content type", () => {
  assert.deepEqual(configuration.headers, [{
    source: "/downloads/PocketStamp-Scanner-v1.1.1.apk",
    headers: [
      { key: "Content-Type", value: "application/vnd.android.package-archive" },
      { key: "Content-Disposition", value: "attachment; filename=\"PocketStamp-Scanner-v1.1.1.apk\"" },
      { key: "Cache-Control", value: "public, max-age=3600, must-revalidate" },
    ],
  }]);
});

test("production join middleware overwrites the authenticated public-origin boundary", () => {
  const previous = process.env.POCKETSTAMP_VERCEL_PROXY_TOKEN;
  process.env.POCKETSTAMP_VERCEL_PROXY_TOKEN = "A".repeat(43);
  try {
    const response = middleware(new Request("https://www.getpocketstamp.com/join/yeems-coffee", {
      headers: {
        "x-pocketstamp-public-origin": "https://attacker.example",
        "x-pocketstamp-proxy-token": "B".repeat(43),
      },
    }));
    assert.equal(response.headers.get("x-middleware-request-x-pocketstamp-public-origin"), "https://www.getpocketstamp.com");
    assert.equal(response.headers.get("x-middleware-request-x-pocketstamp-proxy-token"), "A".repeat(43));
    assert.equal(response.headers.get("x-pocketstamp-proxy-token"), null);
    assert.deepEqual(middlewareConfig.matcher, [
      "/join/:merchantSlug((?!pocket-stamp-demo$)[^/]+)",
      "/join/:merchantSlug((?!pocket-stamp-demo$)[^/]+)/success",
      "/join/:merchantSlug((?!pocket-stamp-demo$)[^/]+)/google-save-link",
    ]);
  } finally {
    if (previous === undefined) delete process.env.POCKETSTAMP_VERCEL_PROXY_TOKEN;
    else process.env.POCKETSTAMP_VERCEL_PROXY_TOKEN = previous;
  }
});

test("preview and missing-secret middleware cannot assert the production public origin", () => {
  const previous = process.env.POCKETSTAMP_VERCEL_PROXY_TOKEN;
  delete process.env.POCKETSTAMP_VERCEL_PROXY_TOKEN;
  try {
    for (const url of ["https://preview.vercel.app/join/yeems-coffee", "https://www.getpocketstamp.com/join/yeems-coffee"]) {
      const response = middleware(new Request(url, { headers: { "x-pocketstamp-public-origin": "https://attacker.example" } }));
      assert.notEqual(response.headers.get("x-middleware-request-x-pocketstamp-public-origin"), "https://www.getpocketstamp.com");
    }
  } finally {
    if (previous !== undefined) process.env.POCKETSTAMP_VERCEL_PROXY_TOKEN = previous;
  }
});
