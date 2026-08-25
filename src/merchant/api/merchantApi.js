const API_BASE_URL = "https://pocketstamp-wallet-backend-production.up.railway.app";

let authenticationFailureHandler = null;
let authenticationFailureNotified = false;

export function isMerchantAuthenticationError(error) {
  return error?.status === 401;
}

export function setMerchantAuthenticationFailureHandler(handler) {
  authenticationFailureHandler = typeof handler === "function" ? handler : null;
  authenticationFailureNotified = false;

  return () => {
    if (authenticationFailureHandler === handler) {
      authenticationFailureHandler = null;
      authenticationFailureNotified = false;
    }
  };
}

export function resetMerchantAuthenticationFailure() {
  authenticationFailureNotified = false;
}

function notifyAuthenticationFailure(error) {
  if (
    !isMerchantAuthenticationError(error) ||
    !authenticationFailureHandler ||
    authenticationFailureNotified
  ) {
    return;
  }

  authenticationFailureNotified = true;
  authenticationFailureHandler(error);
}

async function requestMerchantJson(path, options = {}, { authenticated = false } = {}) {
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
    if (authenticated) notifyAuthenticationFailure(parseError);
    throw parseError;
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      "Something went wrong. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.result || null;
    error.responseText = text;
    if (authenticated) notifyAuthenticationFailure(error);
    throw error;
  }

  return payload;
}

function withMerchantSession(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

function requestAuthenticatedMerchantJson(accessToken, path, options = {}) {
  return requestMerchantJson(
    path,
    {
      ...options,
      headers: {
        ...withMerchantSession(accessToken),
        ...options.headers,
      },
    },
    { authenticated: true },
  );
}

export function loginMerchant(email, password) {
  return requestMerchantJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refreshMerchantSession(refreshToken) {
  return requestMerchantJson("/api/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) });
}

export function logoutMerchant(accessToken) {
  return requestAuthenticatedMerchantJson(accessToken, "/api/auth/logout", { method: "POST" });
}

export function requestMerchantPasswordRecovery(email) {
  return requestMerchantJson("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export function updateMerchantPassword(accessToken, password) {
  return requestAuthenticatedMerchantJson(accessToken, "/api/auth/password", { method: "POST", body: JSON.stringify({ password }) });
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

export function acceptExistingMerchantSetup({ token, password }) {
  return requestMerchantJson("/api/merchant/setup/accept-existing", { method: "POST", body: JSON.stringify({ token, password }) });
}

export function fetchMerchantMe(accessToken) {
  return requestAuthenticatedMerchantJson(accessToken, "/api/auth/me");
}

export function fetchMerchantActivity(accessToken, { limit = 10, page = null, pageSize = null, period = null } = {}) {
  const params = new URLSearchParams();
  if (page !== null) params.set("page", String(page));
  if (pageSize !== null) params.set("pageSize", String(pageSize));
  else params.set("limit", String(limit));
  if (period) params.set("period", period);
  return requestAuthenticatedMerchantJson(accessToken, `/api/merchant/activity?${params.toString()}`);
}

export function fetchMerchantCustomers(
  accessToken,
  { search = "", status = "all", page = 1, pageSize = 10 } = {},
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    status,
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  return requestAuthenticatedMerchantJson(
    accessToken,
    `/api/merchant/customers?${params.toString()}`,
  );
}

export function fetchMerchantReminderSummary(accessToken) {
  return requestAuthenticatedMerchantJson(accessToken, "/api/merchant/reminders/summary");
}

export function fetchMerchantDashboardSummary(accessToken) {
  return requestAuthenticatedMerchantJson(accessToken, "/api/merchant/dashboard/summary");
}

export function fetchMerchantScannerLaunchOptions(accessToken) {
  return requestAuthenticatedMerchantJson(accessToken, "/api/merchant/scanner/launch-options");
}

export function createMerchantScannerLaunch(accessToken, deviceId) {
  return requestAuthenticatedMerchantJson(accessToken, "/api/merchant/scanner/launch-sessions", {
    method: "POST",
    body: JSON.stringify({ deviceId }),
  });
}

export function createNativeScannerProvisioningLaunch(accessToken, deviceId) {
  return requestAuthenticatedMerchantJson(accessToken, "/api/merchant/scanner/native-provisioning/launch-sessions", {
    method: "POST",
    body: JSON.stringify({ deviceId }),
  });
}

export function fetchMerchantCampaigns(accessToken) {
  return requestAuthenticatedMerchantJson(accessToken, "/api/merchant/campaigns");
}

export function createMerchantCampaign(accessToken, { message, scheduledAt }) {
  return requestAuthenticatedMerchantJson(accessToken, "/api/merchant/campaigns", {
    method: "POST",
    body: JSON.stringify({ message, scheduledAt }),
  });
}

export function cancelMerchantCampaign(accessToken, campaignId) {
  return requestAuthenticatedMerchantJson(
    accessToken,
    `/api/merchant/campaigns/${encodeURIComponent(campaignId)}/cancel`,
    {
      method: "POST",
    },
  );
}
