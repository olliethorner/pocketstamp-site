import { useEffect, useState } from "react";
import {
  CRM_ACTIVITY_TYPES,
  CRM_STAGES,
  activityIcon,
  assignedAdminLabel,
  calendarDays,
  calendarEntries,
  crmListFilter,
  crmListMessage,
  crmSearch,
  crmSort,
  decorateTimelineActivities,
  followUpUrgency,
  hasTechnicalTabs,
  isArchived,
  localDayKey,
  pipelineCounts,
  pocketStampState,
  stageLabel,
} from "./adminCrm.js";

const API_BASE = import.meta.env.VITE_POCKETSTAMP_BACKEND_URL;
async function request(path, options, token) {
  if (!API_BASE) throw new Error("Missing VITE_POCKETSTAMP_BACKEND_URL.");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "CRM request failed.");
  return payload;
}
const date = (value) => {
  if (!value) return "—";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  }).format(new Date(value));
};
const datetimeLocal = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  const local = new Date(parsed.valueOf() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const badge =
  "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100";
const urgencyClass = (value) =>
  followUpUrgency(value) === "today"
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : followUpUrgency(value) === "overdue"
      ? "bg-red-50 text-red-800 ring-red-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";

function CrmCalendar({ accounts, month, onMonth, onDate }) {
  const entries = calendarEntries(accounts), today = localDayKey(new Date());
  return (
    <section className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200" aria-label="Follow-up calendar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{new Intl.DateTimeFormat("en-GB", { month:"long", year:"numeric" }).format(month)}</h2>
        <div className="flex gap-2">
          <button className="ps-button-secondary !px-3 !py-2" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))} aria-label="Previous month">←</button>
          <button className="ps-button-secondary !px-3 !py-2" onClick={() => onMonth(new Date())}>Today</button>
          <button className="ps-button-secondary !px-3 !py-2" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))} aria-label="Next month">→</button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day)=><span className="py-1" key={day}>{day}</span>)}
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-xl ring-1 ring-slate-200">
        {calendarDays(month).map((day) => { const key=localDayKey(day), dayEntries=entries[key]||[], inMonth=day.getMonth()===month.getMonth(); return (
          <div className={`min-h-20 border-b border-r border-slate-100 p-1.5 ${inMonth?'bg-white':'bg-slate-50 text-slate-400'}`} key={key}>
            <button className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${key===today?'bg-[var(--ps-blue)] text-white':''}`} onClick={() => onDate(key)} aria-label={`Filter follow-ups for ${key}`}>{day.getDate()}</button>
            <div className="mt-1 grid gap-1">
              {dayEntries.slice(0,2).map((account)=><a className="min-w-0 rounded bg-emerald-50 px-1.5 py-1 text-[10px] text-emerald-900 no-underline" href={`/admin/crm/cafes/${account.id}`} key={account.id} title={account.follow_up_note||account.display_name||account.name}><span className="block truncate font-bold">{account.display_name||account.name}</span>{account.follow_up_note?<span className="block truncate opacity-75">{account.follow_up_note}</span>:null}</a>)}
              {dayEntries.length>2?<button className="text-left text-[10px] font-semibold text-slate-500" onClick={() => onDate(key)}>+{dayEntries.length-2} more</button>:null}
            </div>
          </div>
        );})}
      </div>
    </section>
  );
}

export function CrmCafesPage({ accessToken, Shell, adminContext, onLogout }) {
  const [accounts, setAccounts] = useState([]),
    [archivedAccounts, setArchivedAccounts] = useState([]),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("next_follow_up_at:asc"),
    [month, setMonth] = useState(new Date()),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let current = true;
    Promise.all([
      request("/api/admin/crm/accounts?sort=next_follow_up", {}, accessToken),
      request("/api/admin/crm/accounts?sort=next_follow_up&archived=true", {}, accessToken),
    ])
      .then(([active, archived]) => {
        if (current) { setAccounts(active.accounts || []); setArchivedAccounts(archived.accounts || []); }
      })
      .catch((e) => {
        if (current) setError(e.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [accessToken]);
  const visibleAccounts = filter === "archived" ? archivedAccounts : accounts,
    viewLoading = loading,
    filtered = crmSort(crmSearch(crmListFilter(visibleAccounts, filter),search),sort),
    counts = pipelineCounts(accounts,archivedAccounts.length),
    message = crmListMessage({
      loading: viewLoading,
      error,
      total: visibleAccounts.length,
      visible: filtered.length,
    });
  return (
    <Shell
      active="/admin/cafes"
      adminContext={adminContext}
      onLogout={onLogout}
    >
      <section className="ps-flow-card !p-4 lg:!p-6">
        <p className="ps-eyebrow">Sales Workspace</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Cafés</h1>
            <p className="mt-2 text-slate-500">
              Prospects and PocketStamp merchants in one sales view.
            </p>
          </div>
        </div>
        <CrmCalendar accounts={accounts} month={month} onMonth={setMonth} onDate={(key)=>setFilter(`date:${key}`)} />
        <section className="mt-5" aria-label="Pipeline summary">
          <h2 className="text-lg font-semibold">Pipeline</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            {[["active_prospects","Active prospects"],["interested","Interested"],["trials","Trials"],["customers","Customers"],["due_today","Due today"],["overdue","Overdue"],["archived","Archived"]].map(([key,label])=><button className={`rounded-xl p-3 text-left ring-1 transition hover:ring-[var(--ps-blue)] ${filter===key?'bg-blue-50 ring-blue-200':'bg-[#fbfaf7] ring-slate-200'}`} key={key} onClick={()=>setFilter(key)}><span className="block text-2xl font-semibold">{counts[key]}</span><span className="text-xs font-bold text-slate-500">{label}</span></button>)}
          </div>
        </section>
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input className="ps-input lg:max-w-sm" aria-label="Search cafés" placeholder="Search café, contact, email, phone or location" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["all", "All"],
            ["follow_up", "Needs follow-up"],
            ["due_today", "Due today"],
            ["overdue", "Overdue"],
            ["interested", "Interested"],
            ["trials", "Trials"],
            ["customers", "Customers"],
            ["configured", "Configured"],
            ["archived", "Archived"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={
                filter === v ? "ps-button-primary" : "ps-button-secondary"
              }
              onClick={() => setFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
        </div>
        {filter.startsWith("date:")?<div className="mt-3 flex items-center gap-2 text-sm"><strong>Follow-ups on {date(filter.slice(5))}</strong><button className="text-[var(--ps-blue)]" onClick={()=>setFilter("all")}>Clear</button></div>:null}
        {error ? <p className="mt-5 text-red-700">{error}</p> : null}
        <div
          className="mt-4 hidden overflow-x-auto rounded-xl ring-1 ring-slate-200 md:block"
          aria-busy={viewLoading}
        >
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-[#fbfaf7] text-xs uppercase text-slate-500">
              <tr>
                {[["Café","name"],["Location","location"],["Primary contact","contact"],["Stage","stage"],["Last contact","last_contact_at"],["Next follow-up","next_follow_up_at"],["PocketStamp",null],["Assigned to",null]].map(([label,key]) => <th className={`px-3 py-2 ${["PocketStamp","Assigned to"].includes(label)?"hidden lg:table-cell":""}`} key={label}>{key?<button className="font-bold uppercase" onClick={()=>setSort(`${key}:${sort===`${key}:asc`?'desc':'asc'}`)}>{label}{sort.startsWith(`${key}:`)?sort.endsWith("asc")?" ↑":" ↓":""}</button>:label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr className="cursor-pointer hover:bg-blue-50/40" key={a.id} onClick={() => { window.location.href=`/admin/crm/cafes/${a.id}`; }}>
                  <td className="px-3 py-2.5">
                    <a
                      className="font-semibold text-[var(--ps-blue)] no-underline"
                      href={`/admin/crm/cafes/${a.id}`}
                    >
                      {a.display_name || a.name}
                    </a>
                    {isArchived(a) ? (
                      <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                        Archived
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {a.locality || a.address || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {a.primary_contact?.name || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={badge}>{stageLabel(a.stage)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {date(a.last_contact_at)}
                  </td>
                  <td className="px-3 py-2.5"><span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ring-1 ${urgencyClass(a.next_follow_up_at)}`}>{date(a.next_follow_up_at)}</span>
                  </td>
                  <td className="hidden px-3 py-2.5 text-slate-600 lg:table-cell"><span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold">{pocketStampState(a)}</span>
                  </td>
                  <td className="hidden px-3 py-2.5 text-slate-600 lg:table-cell">
                    {assignedAdminLabel(a, adminContext)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {message ? (
            <p className="p-5 text-slate-500" role="status">
              {message}
            </p>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 md:hidden">
          {filtered.map((a)=><a className="rounded-xl bg-white p-4 text-inherit no-underline ring-1 ring-slate-200" href={`/admin/crm/cafes/${a.id}`} key={a.id}><div className="flex items-start justify-between gap-3"><strong>{a.display_name||a.name}</strong><span className={badge}>{stageLabel(a.stage)}</span></div><p className="mt-1 text-sm text-slate-500">{a.locality||a.address||"Location unavailable"}</p><div className={`mt-3 rounded-lg px-3 py-2 text-sm ring-1 ${urgencyClass(a.next_follow_up_at)}`}><span className="font-semibold">Next follow-up:</span> {date(a.next_follow_up_at)}</div></a>)}
          {message?<p className="text-slate-500" role="status">{message}</p>:null}
        </div>
      </section>
    </Shell>
  );
}

export function CrmAccountPage({
  accountId,
  accessToken,
  Shell,
  adminContext,
  onLogout,
}) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [activity, setActivity] = useState({
      activityType: "in_person_visit",
      direction: "outbound",
      happenedOn: new Date().toISOString().slice(0, 10),
      summary: "",
      notes: "",
    }),
    [nextSteps, setNextSteps] = useState({
      nextFollowUpAt: "",
      followUpNote: "",
      keyObjection: "",
    }),
    [saving, setSaving] = useState(false),
    [contact, setContact] = useState({
      name: "",
      role: "unknown",
      email: "",
      phone: "",
    });
  const load = () =>
    request(`/api/admin/crm/accounts/${accountId}`, {}, accessToken)
      .then((payload) => {
        setData(payload);
        setNextSteps({
          nextFollowUpAt: datetimeLocal(payload.account.next_follow_up_at),
          followUpNote: payload.account.follow_up_note || "",
          keyObjection: payload.account.key_objection || "",
        });
      })
      .catch((e) => setError(e.message));
  useEffect(load, [accountId, accessToken]);
  if (!data)
    return (
      <Shell
        active="/admin/cafes"
        adminContext={adminContext}
        onLogout={onLogout}
      >
        <section className="ps-flow-card">
          {error || "Loading CRM account…"}
        </section>
      </Shell>
    );
  const { account, contacts, activities, primaryContact } = data;
  async function patch(values) {
    await request(
      `/api/admin/crm/accounts/${accountId}`,
      { method: "PATCH", body: JSON.stringify(values) },
      accessToken,
    );
    return load();
  }
  async function log(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const optionalNextSteps = {};
      if (nextSteps.nextFollowUpAt)
        optionalNextSteps.nextFollowUpAt = new Date(nextSteps.nextFollowUpAt).toISOString();
      if (nextSteps.followUpNote.trim())
        optionalNextSteps.followUpNote = nextSteps.followUpNote;
      if (nextSteps.keyObjection.trim() && nextSteps.keyObjection.trim() !== (account.key_objection || ""))
        optionalNextSteps.keyObjection = nextSteps.keyObjection;
      await request(
        `/api/admin/crm/accounts/${accountId}/activities`,
        { method: "POST", body: JSON.stringify({ ...activity, ...optionalNextSteps }) },
        accessToken,
      );
      setActivity({ ...activity, summary: "", notes: "" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function saveNextSteps() {
    setSaving(true);
    setError("");
    try {
      await patch({
        nextFollowUpAt: nextSteps.nextFollowUpAt ? new Date(nextSteps.nextFollowUpAt).toISOString() : null,
        followUpNote: nextSteps.followUpNote || null,
        keyObjection: nextSteps.keyObjection || null,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function completeFollowUp() {
    setSaving(true);
    setError("");
    try {
      await request(
        `/api/admin/crm/accounts/${accountId}/follow-up/complete`,
        { method: "POST", body: JSON.stringify({}) },
        accessToken,
      );
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function addContact(e) {
    e.preventDefault();
    await request(
      `/api/admin/crm/accounts/${accountId}/contacts`,
      { method: "POST", body: JSON.stringify(contact) },
      accessToken,
    );
    setContact({ name: "", role: "unknown", email: "", phone: "" });
    load();
  }
  return (
    <Shell
      active="/admin/cafes"
      adminContext={adminContext}
      onLogout={onLogout}
    >
      <section className="ps-flow-card">
        <p className="ps-eyebrow">Sales</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">
              {account.display_name || account.name}
            </h1>
            <p className="mt-2 text-slate-500">{pocketStampState(account)}</p>
            {isArchived(account) ? (
              <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                Archived
              </span>
            ) : null}
          </div>
          {isArchived(account) && adminContext?.role === "owner" ? (
            <button className="ps-button-secondary" onClick={() => patch({ archived: false })}>
              Restore account
            </button>
          ) : null}
        </div>
        <h2 className="mt-6 text-xl font-semibold">Sales overview</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
            <label className="text-xs font-bold uppercase text-slate-500" htmlFor="crm-sales-stage">Stage</label>
            <select
              id="crm-sales-stage"
              className="ps-input mt-2"
              aria-label="Sales stage"
              value={account.stage}
              onChange={(e) => patch({ stage: e.target.value })}
            >
              {CRM_STAGES.map((s) => (
                <option value={s} key={s}>
                  {stageLabel(s)}
                </option>
              ))}
            </select>
          </div>
          {[
            ["Assigned to", assignedAdminLabel(account, adminContext)],
            ["Last contact", date(account.last_contact_at)],
            ["Next follow-up", date(account.next_follow_up_at)],
            ["Primary contact", primaryContact?.name || "—"],
            ["Trial", stageLabel(account.trial_status)],
          ].map(([l, v]) => (
            <div
              className={`rounded-xl p-4 ring-1 ${l === "Next follow-up" ? urgencyClass(account.next_follow_up_at) : "bg-[#fbfaf7] ring-slate-100"}`}
              key={l}
            >
              <p className="text-xs font-bold uppercase text-slate-500">{l}</p>
              <p className="mt-2 font-semibold">{v}</p>
            </div>
          ))}
        </div>
        {error ? <p className="mt-5 text-red-700" role="alert">{error}</p> : null}
        <form className="mt-6 rounded-2xl p-5 ring-1 ring-slate-200" onSubmit={log}>
          <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Quick log activity</h2>
            <div className="mt-4 grid gap-3">
              <select
                className="ps-input"
                value={activity.activityType}
                onChange={(e) =>
                  setActivity({ ...activity, activityType: e.target.value })
                }
              >
                {CRM_ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {stageLabel(t)}
                  </option>
                ))}
              </select>
              <input
                className="ps-input"
                type="date"
                value={activity.happenedOn}
                onChange={(e) =>
                  setActivity({ ...activity, happenedOn: e.target.value })
                }
              />
              <input
                className="ps-input"
                required
                maxLength="500"
                placeholder="Short summary"
                value={activity.summary}
                onChange={(e) =>
                  setActivity({ ...activity, summary: e.target.value })
                }
              />
              <textarea
                className="ps-input"
                placeholder="Notes"
                value={activity.notes}
                onChange={(e) =>
                  setActivity({ ...activity, notes: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Next steps</h2>
            <label className="mt-4 block text-sm font-bold">
              Next follow-up
              <input
                className="ps-input mt-2"
                type="datetime-local"
                value={nextSteps.nextFollowUpAt}
                onChange={(e) => setNextSteps({ ...nextSteps, nextFollowUpAt: e.target.value })}
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Follow-up note
              <textarea
                className="ps-input mt-2"
                value={nextSteps.followUpNote}
                onChange={(e) => setNextSteps({ ...nextSteps, followUpNote: e.target.value })}
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Key objection
              <textarea
                className="ps-input mt-2"
                value={nextSteps.keyObjection}
                onChange={(e) => setNextSteps({ ...nextSteps, keyObjection: e.target.value })}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="ps-button-secondary" disabled={saving} onClick={saveNextSteps}>Save next steps</button>
              {account.next_follow_up_at ? (
                <button type="button" className="ps-button-secondary" disabled={saving} onClick={completeFollowUp}>Mark follow-up complete</button>
              ) : null}
            </div>
          </div>
          </div>
          <button className="ps-button-primary mt-5" disabled={saving}>{saving ? "Saving…" : "Save activity"}</button>
        </form>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-xl font-semibold">Activity timeline</h2>
            <div className="mt-4 grid gap-2">
              {decorateTimelineActivities(activities).map((a) => (
                <article
                  className={`rounded-xl p-3 ring-1 ${a.activity_type === "status_change" ? "bg-blue-50/60 ring-blue-200" : "bg-white ring-slate-200"}`}
                  key={a.id}
                >
                  <div className="flex justify-between gap-3">
                    <strong className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-xs" aria-hidden="true">{activityIcon(a.activity_type)}</span>{stageLabel(a.activity_type)}</strong>
                    <span className="text-sm text-slate-500">
                      {date(a.happened_at || a.happened_on)}
                    </span>
                  </div>
                  <p className="mt-2">{a.summary}</p>
                  {a.displayNotes ? (
                    <p className="mt-2 text-sm text-slate-500">
                      {a.displayNotes}
                    </p>
                  ) : null}
                  {a.reviewContext ? (
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      {a.reviewContext}
                    </p>
                  ) : null}
                </article>
              ))}
              {!activities.length ? (
                <p className="text-slate-500">No sales activity yet.</p>
              ) : null}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Contacts</h2>
            <div className="mt-4 grid gap-3">
              {contacts.map((c) => (
                <div
                  className="rounded-xl p-4 ring-1 ring-slate-200"
                  key={c.id}
                >
                  <strong>{c.name}</strong> · {stageLabel(c.role)}
                  {c.is_primary ? " · Primary" : ""}
                  <p className="text-sm text-slate-500">
                    {c.email || c.phone || "No contact method"}
                  </p>
                </div>
              ))}
            </div>
            <form
              className="mt-4 grid gap-3 rounded-xl p-4 ring-1 ring-slate-200"
              onSubmit={addContact}
            >
              <input
                className="ps-input"
                required
                placeholder="Contact name"
                value={contact.name}
                onChange={(e) =>
                  setContact({ ...contact, name: e.target.value })
                }
              />
              <select
                className="ps-input"
                value={contact.role}
                onChange={(e) =>
                  setContact({ ...contact, role: e.target.value })
                }
              >
                {["owner", "manager", "employee", "other", "unknown"].map(
                  (r) => (
                    <option key={r}>{r}</option>
                  ),
                )}
              </select>
              <input
                className="ps-input"
                placeholder="Email"
                value={contact.email}
                onChange={(e) =>
                  setContact({ ...contact, email: e.target.value })
                }
              />
              <button className="ps-button-secondary">Add contact</button>
            </form>
          </section>
        </div>
        <section className="mt-8 rounded-2xl p-5 ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold">PocketStamp setup</h2>
          {hasTechnicalTabs(account) ? (
            <a
              className="ps-button-secondary mt-4"
              href={`/admin/cafes/${account.merchant_id}`}
            >
              Open Wallet, assets, scanner and settings
            </a>
          ) : (
            <p className="mt-3 text-slate-500">
              Create or link a PocketStamp demo when this prospect is ready.
            </p>
          )}
        </section>
      </section>
    </Shell>
  );
}
