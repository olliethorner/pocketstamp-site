import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  createMerchantScannerLaunch,
  fetchMerchantScannerLaunchOptions,
} from "./merchant/api/merchantApi.js";

test("merchant scanner launch API uses authenticated safe device endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ ok: true, devices: [] }), {
      status: options.method === "POST" ? 201 : 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  try {
    await fetchMerchantScannerLaunchOptions("merchant-token");
    await createMerchantScannerLaunch("merchant-token", "scanner-exact");
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.match(calls[0].url, /\/api\/merchant\/scanner\/launch-options$/);
  assert.equal(calls[0].options.headers.Authorization, "Bearer merchant-token");
  assert.match(calls[1].url, /\/api\/merchant\/scanner\/launch-sessions$/);
  assert.deepEqual(JSON.parse(calls[1].options.body), { deviceId: "scanner-exact" });
  assert.equal(JSON.stringify(calls).includes("deviceToken"), false);
});

test("Scanner dashboard action renders zero, one, and multiple-device states without secrets", async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const { default: ScannerLaunchAction } = await vite.ssrLoadModule("/src/merchant/ScannerLaunchAction.jsx");
    const render = (props) => renderToStaticMarkup(React.createElement(ScannerLaunchAction, { onLaunch() {}, ...props }));
    assert.match(render({ devices: [] }), /Scanner Mode isn’t set up yet/);

    const one = render({ devices: [{ id: "scanner-a", deviceName: "Main Counter", locationName: "High Street" }] });
    assert.match(one, /Open Scanner Mode/);
    assert.match(one, /Main Counter/);
    assert.doesNotMatch(one, /token|hash/i);
    assert.doesNotMatch(one, /<select/);

    const multiple = render({ devices: [
      { id: "scanner-a", deviceName: "Main Counter", locationName: "High Street" },
      { id: "scanner-b", deviceName: "Second Counter", locationName: "Back Bar" },
    ] });
    assert.match(multiple, /Choose a scanner/);
    assert.match(multiple, /Main Counter · High Street/);
    assert.match(multiple, /Second Counter · Back Bar/);
    assert.match(multiple, /disabled/);
  } finally {
    await vite.close();
  }
});

test("dashboard keeps navigation, removes duplicate Overview scanner cards, and Scanner Mode retains existing mutation calls", () => {
  const layout = fs.readFileSync(new URL("./merchant/MerchantLayout.jsx", import.meta.url), "utf8");
  const overview = fs.readFileSync(new URL("./merchant/pages/MerchantOverview.jsx", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  for (const label of ["Overview", "Customers", "Activity", "Marketing", "Get Customers"]) assert.match(layout, new RegExp(label));
  assert.equal(overview.includes("Open Scanner Mode"), false);
  assert.equal(overview.includes("Launch unavailable"), false);
  for (const operation of ["submitScannerScan", "lookupScannerPass", "adjustScannerStamps", "redeemScannerReward", "undoScannerStamp"]) {
    assert.match(app, new RegExp(`${operation}\\(`));
  }
  assert.match(app, /history\.replaceState/);
  assert.match(app, /credentials: "include"/);
  assert.doesNotMatch(app, /device_token_hash/);
});
