import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

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

test("all unrelated current-main rewrites remain unchanged", () => {
  assert.deepEqual(rewrites.filter(({ source }) => !source.startsWith("/join/")), [
    { source: "/demo/pocket-stamp-demo/create", destination: "/api/demo-pocket-stamp-demo-create" },
    { source: "/pass/:serial", destination: `${backend}/pass/:serial` },
    { source: "/legal/privacy", destination: "/index.html" },
    { source: "/legal/terms", destination: "/index.html" },
    { source: "/contact", destination: "/index.html" },
    { source: "/merchant", destination: "/index.html" },
    { source: "/merchant/:path*", destination: "/index.html" },
    { source: "/admin", destination: "/index.html" },
    { source: "/admin/:path*", destination: "/index.html" },
  ]);
  assert.deepEqual(Object.keys(configuration), ["rewrites"]);
});
