function MetricCard({ label, value, helper, iconLabel }) {
  return (
    <div className="ps-dashboard-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--ps-muted)]">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--ps-espresso)]">{value}</p>
          {helper ? <p className="mt-1.5 text-sm text-[var(--ps-muted)]">{helper}</p> : null}
        </div>
        <span className="rounded-xl bg-[var(--ps-blue-soft)] px-3 py-2 text-xs font-bold text-[var(--ps-blue)]">
          {iconLabel}
        </span>
      </div>
    </div>
  );
}

export default function MerchantOverview({
  dashboardSummary,
  dashboardSummaryError,
  isDashboardSummaryLoading,
  activityContent,
  reminderSummary,
  reminderError,
  isReminderSummaryLoading,
  joinUrl,
  copyState,
  onCopyJoinUrl,
}) {
  const metricFallback = dashboardSummaryError ? "Unavailable" : "—";
  const helperFallback = dashboardSummaryError
    ? "This total could not be loaded."
    : "Loading...";

  return (
    <div className="space-y-7">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Active Wallet cards"
          value={isDashboardSummaryLoading ? "..." : dashboardSummary?.activeWalletCards ?? metricFallback}
          helper={
            isDashboardSummaryLoading
              ? helperFallback
              : dashboardSummaryError
                ? helperFallback
                : `${dashboardSummary?.customersJoined ?? 0} customers joined`
          }
          iconLabel="Wallet"
        />
        <MetricCard
          label="Stamps today"
          value={isDashboardSummaryLoading ? "..." : dashboardSummary?.stampsToday ?? metricFallback}
          helper={isDashboardSummaryLoading || dashboardSummaryError ? helperFallback : "Stamps collected today"}
          iconLabel="Stamps"
        />
        <MetricCard
          label="Rewards redeemed"
          value={isDashboardSummaryLoading ? "..." : dashboardSummary?.rewardsRedeemed ?? metricFallback}
          helper={isDashboardSummaryLoading || dashboardSummaryError ? helperFallback : "Recorded redemptions"}
          iconLabel="✓"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)]">
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Recent activity</h2>
              <p className="mt-1 text-sm text-[var(--ps-muted)]">The latest activity from your loyalty programme.</p>
            </div>
            <a href="/merchant/activity" className="text-sm font-semibold text-[var(--ps-blue)]">View all activity</a>
          </div>
          {activityContent}
        </section>

        <aside className="ps-dashboard-card rounded-2xl p-5">
          <h2 className="text-xl font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-2">
            <a href="/merchant/customers" className="rounded-xl border border-[var(--ps-border)] bg-white px-4 py-3 text-center text-sm font-semibold">View Customers</a>
            <a href="/merchant/get-customers" className="rounded-xl border border-[var(--ps-border)] bg-white px-4 py-3 text-center text-sm font-semibold">View Join QR</a>
            {joinUrl ? (
              <button type="button" onClick={onCopyJoinUrl} className="rounded-xl border border-[var(--ps-border)] bg-white px-4 py-3 text-sm font-semibold">
                {copyState === "copied" ? "Join link copied" : copyState === "failed" ? "Copy failed" : "Copy Join Link"}
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      <div>
        <section className="ps-dashboard-card rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Automated reminders</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--ps-muted)]">
                PocketStamp automatically helps bring customers back.
              </p>
            </div>
            <a href="/merchant/marketing" className="shrink-0 text-sm font-semibold text-[var(--ps-blue)]">View</a>
          </div>
          <p className="mt-3 text-sm font-semibold text-[var(--ps-espresso)]">
            {isReminderSummaryLoading
              ? "Loading reminder information..."
              : reminderError
                ? "Reminder information is unavailable right now."
                : `${reminderSummary?.sentThisMonth ?? 0} sent this month · ${reminderSummary?.scheduled ?? 0} scheduled`}
          </p>
        </section>

      </div>
    </div>
  );
}
