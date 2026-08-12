import { useEffect, useState } from "react";
import { updateMerchantPassword } from "./api/merchantApi.js";
import AuthShell, { MerchantAuthBrand } from "./AuthShell.jsx";
import PasswordField from "./PasswordField.jsx";

function readRecoveryToken() {
  const values = new URLSearchParams(window.location.hash.slice(1));
  return values.get("type") === "recovery" ? values.get("access_token") || "" : "";
}

export default function MerchantResetPassword() {
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState("editing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const value = readRecoveryToken();
    if (value) window.history.replaceState({}, "", window.location.pathname);
    const timer = window.setTimeout(() => setToken(value), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (password !== confirm) { setMessage("Passwords do not match."); return; }
    setState("submitting");
    try {
      await updateMerchantPassword(token, password);
      setState("done");
      setMessage("Your password has been updated.");
    } catch {
      setState("editing");
      setMessage("We couldn’t update your password. The link may have expired; request a new reset link and try again.");
    }
  }

  if (token === null) return <AuthShell><MerchantAuthBrand /><div role="status" className="mt-10 rounded-2xl bg-slate-50 p-4 text-slate-600">Checking your reset link…</div></AuthShell>;
  if (!token) return <AuthShell><MerchantAuthBrand /><h1 className="mt-10 text-3xl font-semibold">Reset link unavailable</h1><p className="mt-4 leading-7 text-slate-600">This reset link is invalid, expired or has already been used.</p><a href="/merchant/forgot-password" className="mt-6 inline-block font-semibold text-[#16856f] underline-offset-4 hover:underline">Request a new reset link</a></AuthShell>;
  return <AuthShell><MerchantAuthBrand /><h1 className="mt-10 text-3xl font-semibold">Set a new password</h1><p className="mt-3 leading-7 text-slate-600">Choose a password with at least 8 characters.</p>{state === "done" ? <div role="status" className="mt-8"><p className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">{message}</p><a href="/merchant" className="mt-6 inline-block font-semibold text-[#16856f] underline-offset-4 hover:underline">Continue to sign in</a></div> : <form onSubmit={submit} className="mt-8 space-y-5"><PasswordField id="new-password" label="New password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} describedBy="reset-password-guidance reset-password-message" disabled={state === "submitting"} /><p id="reset-password-guidance" className="text-sm text-slate-500">Use at least 8 characters.</p><PasswordField id="confirm-password" label="Confirm password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" minLength={8} describedBy="reset-password-message" disabled={state === "submitting"} />{message ? <p id="reset-password-message" role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{message}</p> : null}<button disabled={state === "submitting"} className="w-full rounded-xl bg-[#143d3b] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">{state === "submitting" ? "Updating…" : "Update password"}</button></form>}</AuthShell>;
}
