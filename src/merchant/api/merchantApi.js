const API_BASE_URL = "https://pocketstamp-wallet-backend-production.up.railway.app";

async function requestMerchantJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (parseError) {
    parseError.status = response.status;
    parseError.responseText = text;
    throw parseError;
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      "Something went wrong. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    error.responseText = text;
    throw error;
  }

  return payload;
}

function withMerchantSession(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function loginMerchant(email, password) {
  return requestMerchantJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMerchantSetupInvite(token) {
  const params = new URLSearchParams({ token });
  return requestMerchantJson(`/api/merchant/setup?${params.toString()}`);
}

export function activateMerchantSetup({ token, name, password, confirmPassword }) {
  return requestMerchantJson("/api/merchant/setup", {
    method: "POST",
    body: JSON.stringify({ token, name, password, confirmPassword }),
  });
}

export function fetchMerchantMe(accessToken) {
  return requestMerchantJson("/api/auth/me", {
    headers: withMerchantSession(accessToken),
  });
}

export function fetchMerchantActivity(accessToken) {
  return requestMerchantJson("/api/merchant/activity?limit=10", {
    headers: withMerchantSession(accessToken),
  });
}

export function fetchMerchantCustomers(
  accessToken,
  { search = "", status = "all", limit = 50 } = {},
) {
  const params = new URLSearchParams({
    limit: String(limit),
    status,
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  return requestMerchantJson(`/api/merchant/customers?${params.toString()}`, {
    headers: withMerchantSession(accessToken),
  });
}

export function fetchMerchantReminderSummary(accessToken) {
  return requestMerchantJson("/api/merchant/reminders/summary", {
    headers: withMerchantSession(accessToken),
  });
}

export function fetchMerchantDashboardSummary(accessToken) {
  return requestMerchantJson("/api/merchant/dashboard/summary", {
    headers: withMerchantSession(accessToken),
  });
}

export function fetchMerchantCampaigns(accessToken) {
  return requestMerchantJson("/api/merchant/campaigns", {
    headers: withMerchantSession(accessToken),
  });
}

export function createMerchantCampaign(accessToken, { message, scheduledAt }) {
  return requestMerchantJson("/api/merchant/campaigns", {
    method: "POST",
    headers: withMerchantSession(accessToken),
    body: JSON.stringify({ message, scheduledAt }),
  });
}

export function cancelMerchantCampaign(accessToken, campaignId) {
  return requestMerchantJson(
    `/api/merchant/campaigns/${encodeURIComponent(campaignId)}/cancel`,
    {
      method: "POST",
      headers: withMerchantSession(accessToken),
    },
  );
}
