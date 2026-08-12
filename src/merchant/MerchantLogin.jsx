import { useState } from "react";
import { loginMerchant } from "./api/merchantApi.js";
import {
  normalizeMerchantSession,
  normalizeMerchantContext,
} from "./utils/merchantData.js";
import AuthShell, { MerchantAuthBrand } from "./AuthShell.jsx";
import PasswordField from "./PasswordField.jsx";

export default function MerchantLogin({ onLogin, tokenStorageKey }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload = await loginMerchant(email, password);
      const session = normalizeMerchantSession(payload);

      if (!session) {
        throw new Error(
          "Login succeeded, but the response did not include session.accessToken. Safe debug: expected a session object with an accessToken field.",
        );
      }

      localStorage.setItem(tokenStorageKey, JSON.stringify(session));
      onLogin(session, normalizeMerchantContext(payload));
    } catch {
      setError("We couldn’t sign you in. Check your email and password and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell>
          <MerchantAuthBrand />

          <div className="mt-10">
            <h1 className="text-3xl font-semibold text-slate-950">
              Sign in to view your loyalty dashboard
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
              Manage Wallet loyalty activity, join links and scanner setup from
              one clean merchant view.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10"
              />
            </label>

            <div><PasswordField id="merchant-password" label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" describedBy={error ? "merchant-login-error" : undefined} /><a href="/merchant/forgot-password" className="mt-3 inline-block text-sm font-semibold text-[#16856f] underline-offset-4 hover:underline">Forgot password?</a></div>

            {error ? (
              <div id="merchant-login-error" role="alert" className="flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
                  !
                </span>
                <p>{error}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#143d3b] px-5 py-3 font-semibold text-white transition hover:bg-[#0f302f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
    </AuthShell>
  );
}
