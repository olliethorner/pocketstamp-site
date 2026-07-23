import { useEffect, useState } from "react";
import {
  filterActivityRows,
  formatActivityBadge,
  formatActivityDetail,
  formatActivityTime,
  formatActivityTitle,
  getActivityTimestamp,
} from "../utils/activityData.js";

const filters = [["today", "Today"], ["7_days", "7 days"], ["30_days", "30 days"], ["all", "All"]];

function ActivityRow({ item, birthdayRewardsEnabled }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-slate-950">{formatActivityTitle(item, birthdayRewardsEnabled)}</p>
        <p className="mt-1 truncate text-sm text-slate-600">{formatActivityDetail(item)}</p>
        <p className="mt-1 text-sm text-slate-500">{formatActivityTime(getActivityTimestamp(item))}</p>
      </div>
      <span className="w-fit rounded-full bg-[#e7f7f3] px-3 py-1 text-sm font-semibold text-[#16856f]">
        {formatActivityBadge(item, birthdayRewardsEnabled)}
      </span>
    </div>
  );
}

export default function MerchantActivity({
  activityRows,
  isLoading,
  error,
  birthdayRewardsEnabled = false,
  preview = false,
}) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const rows = preview ? activityRows.slice(0, 5) : filterActivityRows(activityRows, filter);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleRows = preview ? rows : rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => setPage(1), [filter, activityRows]);

  if (isLoading) return <div className="rounded-2xl bg-white p-5 text-slate-600 ring-1 ring-slate-200">Loading recent activity...</div>;
  if (error) return <div className="rounded-2xl bg-white p-5 text-red-700 ring-1 ring-red-100">{error}</div>;
  if (!activityRows.length) return <div className="rounded-2xl bg-white p-5 text-slate-600 ring-1 ring-slate-200">No recent loyalty activity yet.</div>;

  return (
    <section>
      {!preview ? (
        <>
          <p className="mb-4 text-sm text-[var(--ps-muted)]">Showing filters across the latest activity returned by PocketStamp.</p>
          <div className="mb-4 flex flex-wrap gap-2" aria-label="Activity date filters">
            {filters.map(([value, label]) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-2 text-sm font-semibold ${filter === value ? "bg-[#143d3b] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {visibleRows.length
          ? visibleRows.map((item, index) => <ActivityRow key={item.id || item._id || item.eventId || `${getActivityTimestamp(item)}-${index}`} item={item} birthdayRewardsEnabled={birthdayRewardsEnabled} />)
          : <div className="p-5 text-slate-600">No recent events match this date filter.</div>}
      </div>
      {!preview && pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {safePage} of {pageCount}</p>
          <div className="flex gap-2">
            <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>Previous</button>
            <button disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>Next</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
