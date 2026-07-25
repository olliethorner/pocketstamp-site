const STATUS_PRESENTATION = {
  scheduled: { label: "Scheduled", tone: "neutral" },
  pending: { label: "Scheduled", tone: "neutral" },
  processing: { label: "Sending", tone: "progress" },
  sending: { label: "Sending", tone: "progress" },
  partially_sent: { label: "Sending", tone: "progress" },
  sent: { label: "Complete", tone: "success" },
  completed: { label: "Complete", tone: "success" },
  cancelled: { label: "Cancelled", tone: "muted" },
  canceled: { label: "Cancelled", tone: "muted" },
  completed_with_failures: { label: "Completed with issues", tone: "warning" },
  not_delivered: { label: "Not delivered", tone: "warning" },
};

const UNKNOWN_STATUS_PRESENTATION = { label: "Sending", tone: "progress" };

function isNonNegativeCount(value) {
  return Number.isFinite(value) && value >= 0;
}

function hasCompletionMarker(campaign) {
  return Boolean(
    campaign.completedAt ||
    campaign.completed_at ||
    campaign.processingCompletedAt ||
    campaign.processing_completed_at
  );
}

function isFinishedCampaign(campaign) {
  return ["sent", "completed", "partially_failed", "failed", "completed_with_failures"].includes(campaign?.status) ||
    hasCompletionMarker(campaign);
}

function getNormalizedPresentation(campaign) {
  const presentations = Object.values(STATUS_PRESENTATION);
  return presentations.find(({ label, tone }) =>
    campaign?.statusLabel === label && campaign?.statusTone === tone
  );
}

function getDeliveryOutcomePresentation(campaign) {
  const deliveredCount = campaign?.deliveredCount ?? campaign?.delivered_count;
  const failedCount = campaign?.failedCount ?? campaign?.failed_count;

  if (deliveredCount === 0) return STATUS_PRESENTATION.not_delivered;
  if (isNonNegativeCount(deliveredCount) && deliveredCount > 0) {
    if (isNonNegativeCount(failedCount) && failedCount > 0) {
      return STATUS_PRESENTATION.completed_with_failures;
    }
    return STATUS_PRESENTATION.completed;
  }

  // Legacy terminal status names are not reliable evidence of delivery failure.
  return STATUS_PRESENTATION.completed;
}

export function getCampaignStatusPresentation(campaignOrStatus) {
  const campaign = typeof campaignOrStatus === "string"
    ? { status: campaignOrStatus }
    : campaignOrStatus;

  const normalizedPresentation = getNormalizedPresentation(campaign);
  if (normalizedPresentation) return normalizedPresentation;

  if (["scheduled", "pending"].includes(campaign?.status)) return STATUS_PRESENTATION.scheduled;
  if (["cancelled", "canceled"].includes(campaign?.status)) return STATUS_PRESENTATION.cancelled;
  if (isFinishedCampaign(campaign)) return getDeliveryOutcomePresentation(campaign);

  return UNKNOWN_STATUS_PRESENTATION;
}

export function canManageCampaigns(merchantContext) {
  return (
    (merchantContext?.role === "owner" || merchantContext?.role === "manager") &&
    merchantContext?.locationId === null
  );
}

export function getCampaignStatusLabel(campaignOrStatus) {
  return getCampaignStatusPresentation(campaignOrStatus).label;
}

export function getCampaignDeliveredText(campaignOrStatus, deliveredCount) {
  const lifecycleLabel = getCampaignStatusLabel(campaignOrStatus);

  if (lifecycleLabel === "Sending" && (!isNonNegativeCount(deliveredCount) || deliveredCount === 0)) {
    return "Sending to customers…";
  }
  if (!["Sending", "Complete", "Not delivered", "Completed with issues"].includes(lifecycleLabel)) {
    return "";
  }
  if (!isNonNegativeCount(deliveredCount)) return "";

  return `Delivered to ${deliveredCount} ${deliveredCount === 1 ? "customer" : "customers"}`;
}

export function normalizeCampaignRows(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.campaigns;
  if (!Array.isArray(rows)) return [];

  return rows.map((campaign) => {
    const statusPresentation = getCampaignStatusPresentation(campaign);
    return {
      id: typeof campaign?.id === "string" ? campaign.id : "",
      message: typeof campaign?.message === "string" ? campaign.message : "",
      scheduledAt: typeof campaign?.scheduledAt === "string" ? campaign.scheduledAt : "",
      status: typeof campaign?.status === "string" ? campaign.status : "",
      statusLabel: statusPresentation.label,
      statusTone: statusPresentation.tone,
      deliveredText: getCampaignDeliveredText(campaign, campaign?.deliveredCount),
    };
  });
}

export function isFutureLocalDateTime(value, now = new Date()) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > now.getTime();
}

export function toScheduledAtIso(value) {
  return new Date(value).toISOString();
}

export function formatCampaignDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
