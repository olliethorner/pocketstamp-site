import { useEffect, useMemo, useState } from "react";
import {
  API_STATUSES, EMPTY_POS_RECORD, NATIVE_SCANNER_STATUSES, PHYSICAL_TEST_STATUSES,
  POCKETSTAMP_ROUTES, PRIORITIES, buildPosMutationPayload, extractPosRecords, normalizePosRecord, posSummary, statusLabel,
} from "./posCompatibility.js";

const fieldOptions = {
  nativeScannerStatus: NATIVE_SCANNER_STATUSES,
  apiStatus: API_STATUSES,
  preferredPocketstampRoute: POCKETSTAMP_ROUTES,
  physicalTestStatus: PHYSICAL_TEST_STATUSES,
  priority: PRIORITIES,
};

function tone(value) {
  if (["ready", "physically_tested", "passed"].includes(value)) return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (["needs_testing", "likely_compatible", "researching", "partial", "strong_opportunity", "high"].includes(value)) return "bg-amber-50 text-amber-800 ring-amber-200";
  if (["not_compatible", "failed"].includes(value)) return "bg-red-50 text-red-800 ring-red-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function Pill({ value }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tone(value)}`}>{statusLabel(value)}</span>;
}

function SelectField({ label, name, value, onChange }) {
  return <label className="block"><span className="text-sm font-semibold">{label}</span><select name={name} value={value} onChange={onChange} className="ps-input mt-2">{fieldOptions[name].map((option) => <option key={option} value={option}>{statusLabel(option)}</option>)}</select></label>;
}

function Editor({ record, saving, onCancel, onSave, onArchive }) {
  const [form, setForm] = useState(record);
  const [error, setError] = useState("");
  function change(event) { const { name, value } = event.target; setForm((current) => ({ ...current, [name]: name === "cafesSeen" ? value.replace(/\D/g, "") : value })); }
  function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) return setError("POS name is required.");
    setError(""); onSave({ ...form, name: form.name.trim(), cafesSeen: Number(form.cafesSeen || 0) });
  }
  return <div className="fixed inset-0 z-50 bg-slate-950/30" role="dialog" aria-modal="true" aria-label={record.id ? `Edit ${record.name}` : "Add POS"}>
    <button className="absolute inset-0 cursor-default" onClick={onCancel} aria-label="Close editor" />
    <form onSubmit={submit} className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto bg-[#fffdf8] p-5 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><p className="ps-eyebrow">POS compatibility record</p><h2 className="mt-2 text-2xl font-semibold">{record.id ? record.name : "Add a POS system"}</h2></div><button type="button" onClick={onCancel} className="ps-button-secondary">Close</button></div>
      {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-semibold">POS name *</span><input className="ps-input mt-2" name="name" value={form.name} onChange={change} maxLength="120" autoFocus /></label>
        <label className="block"><span className="text-sm font-semibold">Vendor</span><input className="ps-input mt-2" name="vendor" value={form.vendor} onChange={change} maxLength="120" /></label>
        <label className="block"><span className="text-sm font-semibold">Typical hardware</span><input className="ps-input mt-2" name="typicalHardware" value={form.typicalHardware} onChange={change} maxLength="500" /></label>
        <label className="block"><span className="text-sm font-semibold">OS / platform</span><input className="ps-input mt-2" name="operatingSystem" value={form.operatingSystem} onChange={change} maxLength="240" /></label>
        <SelectField label="Native scanner" name="nativeScannerStatus" value={form.nativeScannerStatus} onChange={change} />
        <SelectField label="API opportunity" name="apiStatus" value={form.apiStatus} onChange={change} />
        <SelectField label="PocketStamp route" name="preferredPocketstampRoute" value={form.preferredPocketstampRoute} onChange={change} />
        <SelectField label="Physical test" name="physicalTestStatus" value={form.physicalTestStatus} onChange={change} />
        <SelectField label="Priority" name="priority" value={form.priority} onChange={change} />
        <label className="block"><span className="text-sm font-semibold">Cafés seen</span><input className="ps-input mt-2" name="cafesSeen" inputMode="numeric" value={form.cafesSeen} onChange={change} /></label>
        <label className="block sm:col-span-2"><span className="text-sm font-semibold">Notes</span><textarea className="ps-input mt-2 min-h-32" name="notes" value={form.notes} onChange={change} maxLength="5000" /></label>
        <label className="block sm:col-span-2"><span className="text-sm font-semibold">Next action</span><textarea className="ps-input mt-2 min-h-24" name="nextAction" value={form.nextAction} onChange={change} maxLength="2000" /></label>
        <label className="block"><span className="text-sm font-semibold">Last researched</span><input type="date" className="ps-input mt-2" name="lastResearchedAt" value={(form.lastResearchedAt || "").slice(0, 10)} onChange={change} /></label>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3"><button type="submit" disabled={saving} className="ps-button-primary">{saving ? "Saving…" : "Save record"}</button><button type="button" disabled={saving} onClick={onCancel} className="ps-button-secondary">Cancel</button>{record.id ? <button type="button" disabled={saving} onClick={onArchive} className="ml-auto text-sm font-semibold text-slate-500 hover:text-red-700">Archive record</button> : null}</div>
    </form>
  </div>;
}

export default function PosCompatibilityPage({ accessToken, adminFetch, AdminShell, adminContext, onLogout, onNavigate }) {
  const [records, setRecords] = useState([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState(""); const [view, setView] = useState("all"); const [priority, setPriority] = useState("all");
  useEffect(() => { let live = true; adminFetch("/api/admin/pos-compatibility", {}, accessToken).then((payload) => { if (live) setRecords(extractPosRecords(payload)); }).catch((e) => { if (live) setError(e.message || "Unable to load POS compatibility."); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [accessToken, adminFetch]);
  const summary = useMemo(() => posSummary(records), [records]);
  const filtered = useMemo(() => records.filter((record) => {
    const needle = search.trim().toLowerCase(); const matchesSearch = !needle || [record.name, record.vendor, record.notes].some((v) => String(v || "").toLowerCase().includes(needle));
    const matchesView = view === "all" || (view === "ready" && ["ready", "physically_tested"].includes(record.nativeScannerStatus) && record.physicalTestStatus === "passed") || (view === "needs_testing" && (record.nativeScannerStatus === "needs_testing" || ["not_tested", "partial"].includes(record.physicalTestStatus))) || (view === "researching" && record.apiStatus === "researching") || (view === "standalone" && record.preferredPocketstampRoute === "standalone_hardware");
    return matchesSearch && matchesView && (priority === "all" || record.priority === priority);
  }), [records, search, view, priority]);
  async function save(form) { setSaving(true); setError(""); try { const editing = Boolean(form.id); const payload = await adminFetch(editing ? `/api/admin/pos-compatibility/${encodeURIComponent(form.id)}` : "/api/admin/pos-compatibility", { method: editing ? "PATCH" : "POST", body: JSON.stringify(buildPosMutationPayload(form)) }, accessToken); const saved = normalizePosRecord(payload?.record || payload?.data || payload); setRecords((current) => editing ? current.map((r) => r.id === saved.id ? saved : r) : [saved, ...current]); setSelected(null); setMessage(editing ? "POS record saved." : "POS system added."); } catch (e) { setError(e.message || "Unable to save POS record."); } finally { setSaving(false); } }
  async function archive() { if (!selected?.id || !window.confirm(`Archive ${selected.name}? You can recover it through the API's archived view.`)) return; setSaving(true); try { await adminFetch(`/api/admin/pos-compatibility/${encodeURIComponent(selected.id)}/archive`, { method: "POST" }, accessToken); setRecords((current) => current.filter((r) => r.id !== selected.id)); setSelected(null); setMessage("POS record archived."); } catch (e) { setError(e.message || "Unable to archive POS record."); } finally { setSaving(false); } }
  const cards = [["POS systems", summary.total], ["Scanner ready", summary.scannerReady], ["Needs testing", summary.needsTesting], ["API opportunities", summary.apiOpportunities], ["Café sightings", summary.sightings]];
  return <AdminShell active="/admin/pos-compatibility" adminContext={adminContext} onLogout={onLogout} onNavigate={onNavigate}><section className="space-y-6">
    <div className="ps-flow-card"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="ps-eyebrow">Sales intelligence · Product roadmap</p><h1 className="mt-3 text-3xl font-semibold">POS Compatibility</h1><p className="mt-3 max-w-3xl leading-7 text-[var(--ps-muted)]">Track what cafés use, separate research from physical proof, and decide what PocketStamp should validate next.</p></div><button className="ps-button-primary shrink-0" onClick={() => setSelected({ ...EMPTY_POS_RECORD })}>+ Add POS</button></div></div>
    {error ? <div className="rounded-2xl bg-red-50 p-4 font-semibold text-red-800 ring-1 ring-red-100">{error}</div> : null}{message ? <div role="status" className="rounded-2xl bg-emerald-50 p-4 font-semibold text-emerald-800 ring-1 ring-emerald-100">{message}</div> : null}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{cards.map(([label, count]) => <div key={label} className="ps-dashboard-card rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold">{count}</p></div>)}</div>
    <div className="rounded-2xl bg-blue-50/70 p-4 ring-1 ring-blue-100"><p className="text-xs font-bold uppercase tracking-wider text-blue-800">Validated scanner baseline</p><p className="mt-2 text-sm leading-6 text-slate-700">Samsung Galaxy Tab A11 / SM-X133 · Android 16 · Zebra DS9308 · USB OTG · PocketStamp Scanner v1.1.1</p></div>
    <div className="ps-flow-card"><div className="flex flex-col gap-3 lg:flex-row"><input type="search" className="ps-input lg:max-w-md" placeholder="Search POS, vendor or notes" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="ps-input lg:max-w-52" value={view} onChange={(e) => setView(e.target.value)}><option value="all">All statuses</option><option value="ready">Ready</option><option value="needs_testing">Needs testing</option><option value="researching">Researching</option><option value="standalone">Standalone</option></select><select className="ps-input lg:max-w-44" value={priority} onChange={(e) => setPriority(e.target.value)}><option value="all">All priorities</option>{PRIORITIES.map((p) => <option key={p} value={p}>{statusLabel(p)}</option>)}</select></div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600"><span>✓ Green = physically proven</span><span>◐ Amber = research / testing needed</span><span>? Neutral = unknown / untested</span><span>× Red = failed / incompatible</span></div>
      <div className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">{loading ? <div className="p-5 text-slate-600">Loading compatibility records…</div> : !filtered.length ? <div className="p-5 text-slate-600">No POS systems match these filters.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-[#fbfaf7] text-xs font-bold uppercase text-slate-500"><tr>{["POS", "Native scanner", "API", "PocketStamp route", "Physical test", "Cafés", "Priority", "Next action", "Updated"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((record) => <tr key={record.id} onClick={() => setSelected(record)} className="cursor-pointer align-top transition hover:bg-blue-50/40"><td className="px-4 py-4"><span className="font-semibold text-slate-950">{record.name}</span><span className="mt-1 block text-xs text-slate-500">{record.vendor || "Vendor not recorded"}</span></td><td className="px-4 py-4"><Pill value={record.nativeScannerStatus} /></td><td className="px-4 py-4"><Pill value={record.apiStatus} /></td><td className="px-4 py-4"><Pill value={record.preferredPocketstampRoute} /></td><td className="px-4 py-4"><Pill value={record.physicalTestStatus} /></td><td className="px-4 py-4 font-semibold">{record.cafesSeen}</td><td className="px-4 py-4"><Pill value={record.priority} /></td><td className="max-w-xs px-4 py-4 leading-6 text-slate-600">{record.nextAction || "Not recorded"}</td><td className="whitespace-nowrap px-4 py-4 text-slate-500">{record.updatedAt ? new Date(record.updatedAt).toLocaleDateString("en-GB") : "—"}</td></tr>)}</tbody></table></div>}</div>
    </div>
  </section>{selected ? <Editor record={selected} saving={saving} onCancel={() => setSelected(null)} onSave={save} onArchive={archive} /> : null}</AdminShell>;
}
