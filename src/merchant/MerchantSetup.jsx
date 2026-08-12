import { useEffect, useMemo, useState } from "react";
import {
  activateMerchantSetup,
  acceptExistingMerchantSetup,
  fetchMerchantSetupInvite,
} from "./api/merchantApi.js";
import { normalizeMerchantSession } from "./utils/merchantData.js";
import AuthShell, { MerchantAuthBrand } from "./AuthShell.jsx";
import PasswordField from "./PasswordField.jsx";

function setupErrorMessage(error) {
  if (error?.code === "invite_expired") return "This setup link has expired. Ask PocketStamp to send you a new setup link.";
  if (["invite_not_found", "invite_already_used"].includes(error?.code)) return "This setup link is invalid or has already been used. If you already have an account, sign in instead.";
  if (["existing_account", "identity_collision"].includes(error?.code)) return "This email already has a PocketStamp account. Sign in with that account or reset its password.";
  if (error?.code === "weak_password") return "Your password does not meet the password requirements. Use at least 8 characters.";
  return "We couldn’t complete account setup. Please try again or contact PocketStamp support.";
}

export default function MerchantSetup({ tokenStorageKey }) {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);
  const [invite, setInvite] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInvite() {
      if (!token) {
        setError("This setup link is invalid or incomplete. Ask PocketStamp to send you a new setup link.");
        setIsLoading(false);
        return;
      }

      try {
        const payload = await fetchMerchantSetupInvite(token);
        const nextInvite = payload?.invite || null;
        if (!isMounted) return;
        setInvite(nextInvite);
        setName(nextInvite?.name || "");
      } catch (inviteError) {
        if (isMounted) setError(setupErrorMessage(inviteError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInvite();
    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = await activateMerchantSetup({
        token,
        name,
        password,
        confirmPassword,
      });
      const session = normalizeMerchantSession(payload);
      if (!session) {
        throw new Error("Setup completed, but no session token was returned.");
      }

      localStorage.setItem(tokenStorageKey, JSON.stringify(session));
      window.location.href = "/merchant";
    } catch (setupError) {
      setExistingAccount(["existing_account", "identity_collision"].includes(setupError.code));
      setError(setupErrorMessage(setupError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExistingAccountAccept() {
    setError(""); setIsSubmitting(true);
    try {
      const payload = await acceptExistingMerchantSetup({ token, password });
      const session = normalizeMerchantSession(payload);
      if (!session) throw new Error("Sign in succeeded, but no session was returned.");
      localStorage.setItem(tokenStorageKey, JSON.stringify(session));
      window.location.href = "/merchant";
    } catch { setError("We couldn’t sign you in. Check your password or reset it and try again."); }
    finally { setIsSubmitting(false); }
  }

  return (
    <AuthShell width="max-w-lg">
          <MerchantAuthBrand />

          <div className="mt-10">
            <h1 className="text-3xl font-semibold text-slate-950">Set up your merchant account</h1>
            <p className="mt-3 leading-7 text-slate-600">
              {invite
                ? `Create a password for ${invite.merchantName || "your café"} and open your dashboard.`
                : "Create your merchant dashboard login."}
            </p>
          </div>

          {isLoading ? (
            <div role="status" className="mt-8 rounded-2xl bg-[#f8fafc] p-4 text-sm font-semibold text-slate-600">Checking setup link…</div>
          ) : error && !invite ? (
            <div><div role="alert" className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">{error}</div><div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold"><a href="/merchant" className="text-[#16856f]">Sign in</a><a href="/merchant/forgot-password" className="text-[#16856f]">Forgot password?</a></div></div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input type="email" value={invite?.email || ""} readOnly className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Name</span>
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10" />
              </label>
              <div><PasswordField id="setup-password" label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} describedBy="setup-password-guidance setup-error" /><p id="setup-password-guidance" className="mt-2 text-sm text-slate-500">Use at least 8 characters.</p></div>
              <PasswordField id="setup-confirm-password" label="Confirm password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} describedBy="setup-error" />
              {error ? <div id="setup-error" role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">{error}</div> : null}
              {existingAccount ? <div className="space-y-3 text-sm font-semibold"><button type="button" onClick={handleExistingAccountAccept} disabled={isSubmitting || !password} className="w-full rounded-xl border border-[#143d3b] px-5 py-3 text-[#143d3b]">Sign in with this password and accept</button><div className="flex gap-4"><a href="/merchant" className="text-[#16856f]">Sign in</a><a href="/merchant/forgot-password" className="text-[#16856f]">Forgot password?</a></div></div> : null}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#143d3b] px-5 py-3 font-semibold text-white transition hover:bg-[#0f2f2d] disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? "Setting up..." : "Create account"}
              </button>
              <p className="text-sm leading-6 text-slate-500">
                Already set up? <a href="/merchant" className="font-semibold text-[#16856f]">Sign in</a>
              </p>
            </form>
          )}
    </AuthShell>
  );
}
