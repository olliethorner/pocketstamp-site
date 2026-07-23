export const PUBLIC_POCKETSTAMP_URL = "https://getpocketstamp.com";

export function buildMerchantJoinUrl(merchantSlug) {
  if (typeof merchantSlug !== "string" || !merchantSlug.trim()) return "";
  return `${PUBLIC_POCKETSTAMP_URL}/join/${merchantSlug.trim()}`;
}

export function getJoinAvailability(joinUrl) {
  return {
    hasJoinUrl: Boolean(joinUrl),
    showQr: Boolean(joinUrl),
    showActions: Boolean(joinUrl),
  };
}
