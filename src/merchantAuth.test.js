import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  fetchMerchantActivity,
  fetchMerchantDashboardSummary,
  fetchMerchantMe,
  loginMerchant,
  setMerchantAuthenticationFailureHandler,
} from "./merchant/api/merchantApi.js";

const originalFetch = globalThis.fetch;

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  setMerchantAuthenticationFailureHandler(null);
});

test("successful authoritative auth validation returns merchant context", async () => {
  globalThis.fetch = async () => jsonResponse(200, {
    merchantContext: { merchantId: "merchant_1", merchantName: "Test Merchant" },
  });

  const payload = await fetchMerchantMe("valid-token");
  assert.equal(payload.merchantContext.merchantId, "merchant_1");
});

test("simultaneous protected 401 responses notify authentication failure once", async () => {
  let failureCount = 0;
  setMerchantAuthenticationFailureHandler(() => {
    failureCount += 1;
  });
  globalThis.fetch = async () => jsonResponse(401, {
    message: "Valid merchant authentication is required.",
  });

  const results = await Promise.allSettled([
    fetchMerchantActivity("expired-token"),
    fetchMerchantDashboardSummary("expired-token"),
  ]);

  assert.deepEqual(results.map(({ status }) => status), ["rejected", "rejected"]);
  assert.equal(failureCount, 1);
  assert.equal(results[0].reason.status, 401);
});

test("permission 403 does not trigger authentication failure", async () => {
  let failureCount = 0;
  setMerchantAuthenticationFailureHandler(() => {
    failureCount += 1;
  });
  globalThis.fetch = async () => jsonResponse(403, { message: "Insufficient permission." });

  await assert.rejects(fetchMerchantDashboardSummary("valid-token"), {
    status: 403,
  });
  assert.equal(failureCount, 0);
});

test("network and server failures do not trigger authentication failure", async () => {
  let failureCount = 0;
  setMerchantAuthenticationFailureHandler(() => {
    failureCount += 1;
  });

  globalThis.fetch = async () => {
    throw new TypeError("Network connection lost");
  };
  await assert.rejects(fetchMerchantDashboardSummary("valid-token"), TypeError);

  globalThis.fetch = async () => jsonResponse(500, { message: "Internal failure details" });
  await assert.rejects(fetchMerchantDashboardSummary("valid-token"), {
    status: 500,
  });
  assert.equal(failureCount, 0);
});

test("login credential failures do not invoke the protected-request handler", async () => {
  let failureCount = 0;
  setMerchantAuthenticationFailureHandler(() => {
    failureCount += 1;
  });
  globalThis.fetch = async () => jsonResponse(401, { message: "Invalid email or password." });

  await assert.rejects(loginMerchant("merchant@example.com", "incorrect"), {
    status: 401,
  });
  assert.equal(failureCount, 0);
});

test("portal gates protected content and provides retry without raw auth copy", () => {
  const portalSource = readFileSync(
    new URL("./merchant/MerchantPortal.jsx", import.meta.url),
    "utf8",
  );
  const dashboardSource = readFileSync(
    new URL("./merchant/MerchantDashboard.jsx", import.meta.url),
    "utf8",
  );

  assert.ok(
    portalSource.indexOf('authState === "checking"') <
      portalSource.indexOf("<DashboardComponent"),
  );
  assert.match(portalSource, /setAuthState\("authenticated"\)/);
  assert.match(portalSource, /setAuthState\("unauthenticated"\)/);
  assert.match(portalSource, />\s*Retry\s*</);
  assert.doesNotMatch(dashboardSource, /Valid merchant authentication is required/i);
});
