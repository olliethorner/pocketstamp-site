import { useState } from "react";
import { requestMerchantPasswordRecovery } from "./api/merchantApi.js";

export default function MerchantForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(event) {
    event.preventDefault();
    await requestMerchantPasswordRecovery(email).catch(() => null);
    setSent(true);
  }
  return <main className="min-h-screen bg-[#fbfaf7] px-6 py-10 text-slate-950"><div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center"><div className="w-full rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200"><p className="text-xl font-semibold">PocketStamp Merchant</p><h1 className="mt-8 text-3xl font-semibold">Forgot password?</h1>{sent ? <><p className="mt-4 leading-7 text-slate-600">If an account exists for that email, we've sent password reset instructions.</p><a className="mt-6 inline-block font-semibold text-[#16856f]" href="/merchant">Return to sign in</a></> : <form onSubmit={submit} className="mt-8 space-y-5"><label className="block"><span className="text-sm font-semibold">Email</span><input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><button className="w-full rounded-xl bg-[#143d3b] px-5 py-3 font-semibold text-white">Send reset instructions</button><a className="block text-center text-sm font-semibold text-[#16856f]" href="/merchant">Return to sign in</a></form>}</div></div></main>;
}
