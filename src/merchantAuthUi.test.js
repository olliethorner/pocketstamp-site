import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name) => readFileSync(new URL(`./merchant/${name}`, import.meta.url), "utf8");
const login = read("MerchantLogin.jsx");
const forgot = read("MerchantForgotPassword.jsx");
const reset = read("MerchantResetPassword.jsx");
const setup = read("MerchantSetup.jsx");
const account = read("pages/MerchantAccount.jsx");
const layout = read("MerchantLayout.jsx");
const portal = read("MerchantPortal.jsx");
const routes = read("merchantRoutes.js");
const passwordField = read("PasswordField.jsx");
const authShell = read("AuthShell.jsx");

test("login exposes recovery without registration and uses an accessible password toggle", () => {
  assert.match(login, /href="\/merchant\/forgot-password"[^>]*>Forgot password\?<\/a>/);
  assert.doesNotMatch(login, /sign up|register|create account/i);
  assert.match(login, /<PasswordField.*autoComplete="current-password"/s);
  assert.match(passwordField, /aria-label=\{`\$\{visible \? "Hide" : "Show"\}/);
  assert.match(passwordField, /type="button"/);
  assert.match(passwordField, /autoComplete=\{autoComplete\}/);
});

test("forgot-password route has submitting, generic success, and back-to-login states", () => {
  assert.match(routes, /\/merchant\/forgot-password/);
  assert.match(forgot, /Send reset link/);
  assert.match(forgot, /state === "submitting"/);
  assert.match(forgot, /If an account exists for that email/);
  assert.match(forgot, /href="\/merchant"/);
  assert.doesNotMatch(forgot, /error\.message|Supabase|token|session/i);
});

test("reset page covers loading, invalid, mismatch, update, and success without raw errors", () => {
  for (const copy of ["Checking your reset link", "Reset link unavailable", "Passwords do not match", "Update password", "Your password has been updated"]) assert.match(reset, new RegExp(copy));
  assert.match(reset, /<PasswordField[^>]*label="New password"/s);
  assert.match(reset, /<PasswordField[^>]*label="Confirm password"/s);
  assert.doesNotMatch(reset, /error\.message|Supabase|recovery token|auth session/i);
});

test("setup has bounded invite states, policy guidance, and returning-account actions", () => {
  for (const marker of ["invite_expired", "invite_not_found", "invite_already_used", "existing_account", "identity_collision"]) assert.match(setup, new RegExp(marker));
  assert.match(setup, /Use at least 8 characters/);
  assert.match(setup, /Create account/);
  assert.match(setup, /Sign in with this password and accept/);
  assert.doesNotMatch(setup, /setupError\.message|inviteError\.message/);
});

test("Account and Security are complete and discoverable from desktop and mobile navigation", () => {
  for (const copy of ["Account", "Security", "Name", "Email", "Role", "Change password", "Sign out"]) assert.match(account, new RegExp(copy));
  assert.equal((layout.match(/Account &amp; Security/g) || []).length, 2);
  assert.match(layout, /href="\/merchant\/account"/);
  assert.match(account, /onClick=\{onLogout\}/);
  assert.match(portal, /await logoutMerchant\(accessToken\)/);
});

test("auth surfaces retain narrow-screen containment and labelled form controls", () => {
  assert.match(authShell, /overflow-x-hidden/);
  assert.match(authShell, /px-4/);
  for (const source of [login, forgot, reset, setup, account]) assert.doesNotMatch(source, /min-w-\[[4-9]\d{2}px\]/);
  assert.match(forgot, /htmlFor="recovery-email"/);
  assert.match(reset, /role="alert"/);
  assert.match(setup, /role="alert"/);
});
