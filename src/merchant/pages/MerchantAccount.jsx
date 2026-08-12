import { useState } from "react";
import { updateMerchantPassword } from "../api/merchantApi.js";
import PasswordField from "../PasswordField.jsx";

export default function MerchantAccount({ accessToken, merchantContext, onLogout }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault(); setMessage("");
    if (password !== confirm) { setMessage("Passwords do not match."); return; }
    setState("submitting");
    try { await updateMerchantPassword(accessToken, password); setPassword(""); setConfirm(""); setMessage("Password updated."); setState("success"); }
    catch { setMessage("We couldn’t update your password. Please try again."); setState("idle"); }
  }
  return <div className="grid min-w-0 gap-6 lg:grid-cols-2"><section className="min-w-0 rounded-2xl bg-white p-6 ring-1 ring-[var(--ps-border)]"><h2 className="text-xl font-semibold">Account</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-[var(--ps-muted)]">Name</dt><dd className="break-words font-semibold">{merchantContext.name || "—"}</dd></div><div><dt className="text-[var(--ps-muted)]">Email</dt><dd className="break-all font-semibold">{merchantContext.email}</dd></div><div><dt className="text-[var(--ps-muted)]">Role</dt><dd className="font-semibold capitalize">{merchantContext.role}</dd></div></dl></section><section className="min-w-0 rounded-2xl bg-white p-6 ring-1 ring-[var(--ps-border)]"><h2 className="text-xl font-semibold">Security</h2><h3 className="mt-5 font-semibold">Change password</h3><p className="mt-1 text-sm text-[var(--ps-muted)]">Use at least 8 characters.</p><form onSubmit={submit} className="mt-4 space-y-4"><PasswordField id="account-new-password" label="New password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} disabled={state === "submitting"} /><PasswordField id="account-confirm-password" label="Confirm password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" minLength={8} disabled={state === "submitting"} />{message ? <p role={state === "success" ? "status" : "alert"} className="text-sm text-slate-600">{message}</p> : null}<button disabled={state === "submitting"} className="w-full rounded-xl bg-[#143d3b] px-5 py-3 font-semibold text-white disabled:opacity-70 sm:w-auto">{state === "submitting" ? "Updating…" : "Change password"}</button></form><div className="mt-6 border-t border-[var(--ps-border)] pt-6"><button type="button" onClick={onLogout} className="w-full rounded-xl border border-[var(--ps-border)] bg-white px-5 py-3 font-semibold sm:w-auto">Sign out</button></div></section></div>;
}
