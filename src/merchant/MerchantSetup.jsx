import { useEffect, useMemo, useState } from "react";
import {
  activateMerchantSetup,
  fetchMerchantSetupInvite,
} from "./api/merchantApi.js";
import { extractAccessToken } from "./utils/merchantData.js";

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

  useEffect(() => {
    let isMounted = true;

    async function loadInvite() {
      if (!token) {
        setError("This setup link is missing a token.");
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
        if (isMounted) setError(inviteError.message || "Unable to load setup link.");
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
      const accessToken = extractAccessToken(payload);
      if (!accessToken) {
        throw new Error("Setup completed, but no session token was returned.");
      }

      localStorage.setItem(tokenStorageKey, accessToken);
      window.location.href = "/merchant";
    } catch (setupError) {
      setError(setupError.message || "Unable to complete merchant setup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-6 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200">
          <a href="/" className="flex items-center gap-3" aria-label="PocketStamp home">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#143d3b] text-white">PS</span>
            <span className="text-xl font-semibold">PocketStamp Merchant</span>
          </a>

          <div className="mt-10">
            <h1 className="text-3xl font-semibold text-slate-950">Set up your merchant account</h1>
            <p className="mt-3 leading-7 text-slate-600">
              {invite
                ? `Create a password for ${invite.merchantName || "your café"} and open your dashboard.`
                : "Create your merchant dashboard login."}
            </p>
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-2xl bg-[#f8fafc] p-4 text-sm font-semibold text-slate-600">Checking setup link...</div>
          ) : error && !invite ? (
            <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">{error}</div>
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
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={8} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Confirm password</span>
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10" />
              </label>
              {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">{error}</div> : null}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#143d3b] px-5 py-3 font-semibold text-white transition hover:bg-[#0f2f2d] disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? "Setting up..." : "Create account"}
              </button>
              <p className="text-sm leading-6 text-slate-500">
                Already set up? <a href="/merchant" className="font-semibold text-[#16856f]">Sign in</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
