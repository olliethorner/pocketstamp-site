import { useState } from "react";

export default function PasswordField({ id, label, value, onChange, autoComplete, describedBy, minLength, disabled = false }) {
  const [visible, setVisible] = useState(false);
  return <label className="block" htmlFor={id}><span className="text-sm font-semibold text-slate-700">{label}</span><span className="relative mt-2 block"><input id={id} type={visible ? "text" : "password"} value={value} onChange={onChange} autoComplete={autoComplete} aria-describedby={describedBy} disabled={disabled} required minLength={minLength} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-16 text-slate-950 outline-none transition focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10 disabled:bg-slate-50" /><button type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible((current) => !current)} className="absolute inset-y-0 right-1 min-w-12 rounded-lg px-3 text-sm font-semibold text-[#16856f] focus:outline-none focus:ring-2 focus:ring-[#16856f]">{visible ? "Hide" : "Show"}</button></span></label>;
}
