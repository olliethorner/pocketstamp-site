export function normalizeScannerActivities(payload) {
  const activities = Array.isArray(payload?.activities) ? payload.activities : [];
  const seen = new Set();

  return activities
    .filter((activity) => activity && activity.id && !seen.has(activity.id) && seen.add(activity.id))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 5);
}

export function getScannerActivityLabel(type) {
  return {
    stamp_added: "Stamp added",
    reward_redeemed: "Reward redeemed",
    stamps_adjusted: "Stamp count updated",
    stamp_undone: "Stamp undone",
  }[type] || "Scan";
}

export function formatScannerActivityTime(createdAt, locale) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}
