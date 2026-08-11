import {
  classifyActivity,
  formatActivityBadge,
  formatActivityDetail,
  formatActivityTime,
  formatActivityTitle,
  getActivityTimestamp,
} from "../utils/activityData.js";

const filters = [["today", "Today"], ["7_days", "7 days"], ["30_days", "30 days"], ["all", "All"]];

function ActivityRow({ item, birthdayRewardsEnabled }) {
  const type = classifyActivity(item, birthdayRewardsEnabled);
  const badgeClass = type === "reward" ? "bg-violet-50 text-violet-700" : "bg-[#e7f7f3] text-[#16856f]";
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-slate-950">{formatActivityTitle(item, birthdayRewardsEnabled)}</p>
        <p className="mt-1 truncate text-sm text-slate-600">{formatActivityDetail(item)}</p>
        <p className="mt-1 text-sm text-slate-500">{formatActivityTime(getActivityTimestamp(item))}</p>
      </div>
      <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${badgeClass}`}>
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
  period = "all",
  onPeriodChange,
  pagination = null,
  onPageChange,
}) {
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 25;
  const total = pagination?.total || 0;
  const pageCount = Math.max(1, pagination?.totalPages || 0);
  const visibleRows = preview ? activityRows.slice(0, 5) : activityRows;
  const start = (page - 1) * pageSize;

  if (isLoading) return <div className="rounded-2xl bg-white p-5 text-slate-600 ring-1 ring-slate-200">Loading recent activity...</div>;
  if (error) return <div className="rounded-2xl bg-white p-5 text-red-700 ring-1 ring-red-100">{error}</div>;
  if (preview && !activityRows.length) return <div className="rounded-2xl bg-white p-5 text-slate-600 ring-1 ring-slate-200">Activity will appear here when customers collect stamps or redeem rewards.</div>;

  return (
    <section>
      {!preview ? (
        <>
          <p className="mb-4 text-sm text-[var(--ps-muted)]">{total ? `Showing ${start + 1}-${Math.min(start + activityRows.length, total)} of ${total} activities` : "Showing 0 activities"}</p>
          <div className="mb-4 flex flex-wrap gap-2" aria-label="Activity date filters">
            {filters.map(([value, label]) => (
              <button key={value} type="button" aria-pressed={period === value} onClick={() => onPeriodChange(value)} className={`rounded-full px-3 py-2 text-sm font-semibold ${period === value ? "bg-[#143d3b] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {visibleRows.length
          ? visibleRows.map((item, index) => <ActivityRow key={item.id || item._id || item.eventId || `${getActivityTimestamp(item)}-${index}`} item={item} birthdayRewardsEnabled={birthdayRewardsEnabled} />)
          : <div className="p-5 text-slate-600">
              <p>{period === "all" ? "Activity will appear here when customers collect stamps or redeem rewards." : "No activity in this period."}</p>
              {period !== "all" ? <button type="button" onClick={() => onPeriodChange("all")} className="mt-3 text-sm font-semibold text-[#16856f]">Show all activity</button> : null}
            </div>}
      </div>
      {!preview && pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {pageCount}</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold disabled:opacity-45">Previous</button>
            <button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold disabled:opacity-45">Next</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
