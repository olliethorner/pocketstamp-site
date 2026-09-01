import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { invitationAccessToken, SAFE_ERROR, setInvitedAdminPassword, signOutInvitationSession, validateAdminInvitation } from "./adminActivation.js";

const portal = await readFile(new URL("./AdminPortal.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("./App.jsx", import.meta.url), "utf8");
const merchantReset = await readFile(new URL("./merchant/MerchantResetPassword.jsx", import.meta.url), "utf8");

function response(payload, ok = true) { return { ok, async json() { return payload; } }; }

test("Admin activation route resolves before the normal authenticated Admin portal", () => {
  const activation = app.indexOf('pathname === "/admin/set-password"');
  const portalRoute = app.indexOf('pathname.startsWith("/admin")');
  assert.ok(activation >= 0 && activation < portalRoute);
  assert.match(portal, /Set your password/);
  assert.match(portal, /Passwords do not match/);
});

test("missing or non-invite callback session is rejected safely", async () => {
  assert.equal(invitationAccessToken({ hash: "" }), "");
  assert.equal(invitationAccessToken({ hash: "#access_token=secret&type=recovery" }), "");
  await assert.rejects(() => validateAdminInvitation({}), (error) => error.message === SAFE_ERROR);
});

test("valid invite session verifies authenticated Supabase identity and Admin membership", async () => {
  assert.equal(invitationAccessToken({ hash: "#access_token=signed&type=invite" }), "signed");
  const calls = [];
  await validateAdminInvitation({ accessToken: "signed", supabaseUrl: "https://supabase.test", supabaseAnonKey: "anon", backendUrl: "https://backend.test", fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return url.endsWith("/auth/v1/user") ? response({ id: "derived-user" }) : response({ ok: true, eligible: true });
  } });
  assert.deepEqual(calls.map((call) => call.url), ["https://supabase.test/auth/v1/user", "https://backend.test/api/admin/activate"]);
  assert.equal(calls[1].options.headers.Authorization, "Bearer signed");
});

test("password is sent only to authenticated Supabase Auth user endpoint", async () => {
  let request;
  await setInvitedAdminPassword({ accessToken: "signed", password: "private-password", supabaseUrl: "https://supabase.test", supabaseAnonKey: "anon", fetchImpl: async (url, options) => { request = { url, options }; return response({ id: "derived-user" }); } });
  assert.equal(request.url, "https://supabase.test/auth/v1/user");
  assert.equal(request.options.method, "PUT");
  assert.deepEqual(JSON.parse(request.options.body), { password: "private-password" });
});

test("successful setup can close only the invitation session before normal login", async () => {
  let request;
  await signOutInvitationSession({ accessToken: "signed", supabaseUrl: "https://supabase.test", supabaseAnonKey: "anon", fetchImpl: async (url, options) => { request = { url, options }; return response({}); } });
  assert.equal(request.url, "https://supabase.test/auth/v1/logout?scope=local");
  assert.equal(request.options.method, "POST");
});

test("invalid or expired provider response is bounded and existing auth routes remain intact", async () => {
  await assert.rejects(() => validateAdminInvitation({ accessToken: "expired", supabaseUrl: "https://supabase.test", supabaseAnonKey: "anon", backendUrl: "https://backend.test", fetchImpl: async () => response({ code: "raw-provider-code" }, false) }), (error) => error.message === SAFE_ERROR && !error.message.includes("raw-provider-code"));
  assert.match(portal, /function AdminLoginPage/);
  assert.match(merchantReset, /Set a new password/);
});
