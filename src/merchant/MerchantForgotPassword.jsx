import { useState } from "react";
import { requestMerchantPasswordRecovery } from "./api/merchantApi.js";
import AuthShell, { MerchantAuthBrand } from "./AuthShell.jsx";

export default function MerchantForgotPassword() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");
  async function submit(event) {
    event.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    await requestMerchantPasswordRecovery(email).catch(() => null);
    setState("sent");
  }
  return <AuthShell><MerchantAuthBrand /><div className="mt-10"><h1 className="text-3xl font-semibold">Reset your password</h1><p className="mt-3 leading-7 text-slate-600">Enter your merchant email and we’ll send instructions if an account exists.</p></div>{state === "sent" ? <div role="status" className="mt-8"><p className="rounded-2xl bg-emerald-50 p-4 leading-7 text-emerald-900">If an account exists for that email, we’ve sent password reset instructions.</p><a className="mt-6 inline-block font-semibold text-[#16856f] underline-offset-4 hover:underline" href="/merchant">Back to sign in</a></div> : <form onSubmit={submit} className="mt-8 space-y-5"><label className="block" htmlFor="recovery-email"><span className="text-sm font-semibold text-slate-700">Email</span><input id="recovery-email" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10" type="email" autoComplete="email" required disabled={state === "submitting"} value={email} onChange={(event) => setEmail(event.target.value)} /></label><button disabled={state === "submitting"} className="w-full rounded-xl bg-[#143d3b] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">{state === "submitting" ? "Sending…" : "Send reset link"}</button><a className="block text-center text-sm font-semibold text-[#16856f] underline-offset-4 hover:underline" href="/merchant">Back to sign in</a></form>}</AuthShell>;
}
