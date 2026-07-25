import { useState } from "react";
import {
  canManageCampaigns,
  formatCampaignDateTime,
  getCampaignStatusPresentation,
  isFutureLocalDateTime,
  toScheduledAtIso,
} from "../../merchantCampaigns.js";
import {
  cancelMerchantCampaign,
  createMerchantCampaign,
} from "../api/merchantApi.js";
import {
  canCancelCampaign,
  getReminderBehaviours,
  getReminderStats,
} from "../utils/marketingPresentation.js";

function AutomatedReminders({ summary, isLoading, error, birthdayRewardsEnabled }) {
  const stats = getReminderStats(summary);
  const behaviours = getReminderBehaviours(birthdayRewardsEnabled);

  return (
    <section>
      <h2 className="text-2xl font-semibold">Automated Loyalty Reminders</h2>
      <p className="mt-2 max-w-3xl leading-7 text-[var(--ps-muted)]">
        PocketStamp can automatically help bring customers back at useful moments in their loyalty journey.
      </p>

      <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
        {isLoading ? (
          <p className="text-sm font-semibold text-slate-500">Loading reminder information...</p>
        ) : error ? (
          <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            Reminder information is unavailable right now.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Sent this month", stats.sentThisMonth],
              ["Scheduled", stats.scheduled],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {behaviours.map(([title, description]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--ps-muted)]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PromotionalCampaigns({
  accessToken,
  merchantContext,
  campaigns,
  isLoading,
  error,
  onRefresh,
}) {
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [cancellingId, setCancellingId] = useState("");
  const canManage = canManageCampaigns(merchantContext);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "device time";

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || trimmedMessage.length > 90) {
      setFormError("Enter a message of up to 90 characters.");
      return;
    }
    if (!isFutureLocalDateTime(scheduledAt)) {
      setFormError("Choose a time in the future.");
      return;
    }
    setFormError("");
    setIsCreating(true);
    try {
      await createMerchantCampaign(accessToken, {
        message: trimmedMessage,
        scheduledAt: toScheduledAtIso(scheduledAt),
      });
      setMessage("");
      setScheduledAt("");
      await onRefresh();
    } catch (campaignError) {
      setFormError(campaignError.message || "Unable to schedule this update.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCancel(campaignId) {
    if (!window.confirm("Cancel this scheduled update?")) return;
    setFormError("");
    setCancellingId(campaignId);
    try {
      await cancelMerchantCampaign(accessToken, campaignId);
      await onRefresh();
    } catch (campaignError) {
      setFormError(campaignError.message || "Unable to cancel this update.");
    } finally {
      setCancellingId("");
    }
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold">Promotional Campaigns</h2>
      <p className="mt-2 max-w-3xl leading-7 text-[var(--ps-muted)]">
        Create and schedule one-time promotional messages for Apple Wallet customers where this feature is available.
      </p>

      <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
        {canManage ? (
          <form className="grid gap-4 lg:grid-cols-[1fr_18rem_auto] lg:items-end" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold">
              Message
              <textarea className="ps-input mt-2 min-h-24 w-full resize-y" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={90} required placeholder="Share a short update" />
              <span className="mt-1 block text-right text-xs font-normal text-[var(--ps-muted)]">{message.length}/90</span>
            </label>
            <label className="block text-sm font-semibold">
              Schedule time
              <input className="ps-input mt-2 w-full" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required />
              <span className="mt-1 block text-xs font-normal text-[var(--ps-muted)]">Uses this device’s timezone ({timeZone}).</span>
            </label>
            <button className="ps-button-primary" type="submit" disabled={isCreating}>{isCreating ? "Scheduling..." : "Schedule Update"}</button>
          </form>
        ) : (
          <p className="rounded-xl bg-[#fbfaf7] p-4 text-sm text-[var(--ps-muted)]">
            Campaign history is available below. Campaign management is restricted for this account or location.
          </p>
        )}

        {formError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{formError}</p> : null}

        <div className="mt-7 border-t border-[var(--ps-border)] pt-6">
          <h3 className="text-lg font-semibold">Campaign history</h3>
          {isLoading && campaigns.length === 0 ? <p className="mt-4 text-sm text-[var(--ps-muted)]">Loading campaign history...</p> : null}
          {error ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Campaign history is unavailable right now.</p> : null}
          {!isLoading && campaigns.length === 0 && !error ? <p className="mt-4 text-sm text-[var(--ps-muted)]">No updates scheduled yet.</p> : null}
          {campaigns.length ? (
            <div className="mt-4 divide-y divide-[var(--ps-border)] rounded-xl ring-1 ring-[var(--ps-border)]">
              {campaigns.map((campaign) => {
                const statusPresentation = getCampaignStatusPresentation(campaign);
                return (
                <div key={campaign.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{campaign.message}</p>
                    <p className="mt-1 text-sm text-[var(--ps-muted)]">{formatCampaignDateTime(campaign.scheduledAt)}</p>
                    {campaign.deliveredText ? <p className="mt-1 text-sm text-[var(--ps-muted)]">{campaign.deliveredText}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-[var(--ps-blue-soft)] px-3 py-1 text-xs font-semibold text-[var(--ps-blue)]">{statusPresentation.label}</span>
                    {canCancelCampaign(campaign, canManage) ? (
                      <button className="ps-button-secondary" type="button" disabled={cancellingId === campaign.id} onClick={() => handleCancel(campaign.id)}>
                        {cancellingId === campaign.id ? "Cancelling..." : "Cancel"}
                      </button>
                    ) : null}
                  </div>
                </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function MerchantMarketing(props) {
  return (
    <div className="space-y-9">
      <AutomatedReminders
        summary={props.reminderSummary}
        isLoading={props.isReminderSummaryLoading}
        error={props.reminderError}
        birthdayRewardsEnabled={props.birthdayRewardsEnabled}
      />
      <PromotionalCampaigns {...props} />
    </div>
  );
}
