const STATUS_LABELS = {
  scheduled: "Scheduled",
  processing: "Processing",
  sent: "Sent",
  partially_failed: "Partially sent",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function canManageCampaigns(merchantContext) {
  return (
    (merchantContext?.role === "owner" || merchantContext?.role === "manager") &&
    merchantContext?.locationId === null
  );
}

export function getCampaignStatusLabel(status) {
  return STATUS_LABELS[status] || "Unknown";
}

export function getCampaignDeliveredText(status, deliveredCount) {
  if (status === "failed") return "Delivered to 0 customers";
  if (status !== "sent" && status !== "partially_failed") return "";
  if (!Number.isFinite(deliveredCount) || deliveredCount < 0) {
    return "";
  }
  return `Delivered to ${deliveredCount} customers`;
}

export function normalizeCampaignRows(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.campaigns;
  if (!Array.isArray(rows)) return [];

  return rows.map((campaign) => ({
    id: typeof campaign?.id === "string" ? campaign.id : "",
    message: typeof campaign?.message === "string" ? campaign.message : "",
    scheduledAt: typeof campaign?.scheduledAt === "string" ? campaign.scheduledAt : "",
    status: typeof campaign?.status === "string" ? campaign.status : "",
    statusLabel: getCampaignStatusLabel(campaign?.status),
    deliveredText: getCampaignDeliveredText(campaign?.status, campaign?.deliveredCount),
  }));
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
