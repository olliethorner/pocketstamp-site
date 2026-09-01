const SAFE_ERROR = "This invitation link is invalid, expired, or has already been used. Ask PocketStamp for a new invitation.";

export function invitationAccessToken(location = window.location) {
  const hash = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
  const token = hash.get("access_token");
  const type = hash.get("type");
  return token && (!type || type === "invite") ? token : "";
}

async function jsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(SAFE_ERROR);
  return payload;
}

export async function validateAdminInvitation({ accessToken, supabaseUrl, supabaseAnonKey, backendUrl, fetchImpl = fetch }) {
  if (!accessToken || !supabaseUrl || !supabaseAnonKey || !backendUrl) throw new Error(SAFE_ERROR);
  const user = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
  }).then(jsonResponse);
  if (!user?.id) throw new Error(SAFE_ERROR);
  await fetchImpl(`${backendUrl}/api/admin/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
  }).then(jsonResponse);
  return true;
}

export async function setInvitedAdminPassword({ accessToken, password, supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
  if (!accessToken || !password) throw new Error(SAFE_ERROR);
  await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: { apikey: supabaseAnonKey, "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password }),
  }).then(jsonResponse);
}

export async function signOutInvitationSession({ accessToken, supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
  if (!accessToken) return;
  await fetchImpl(`${supabaseUrl}/auth/v1/logout?scope=local`, {
    method: "POST",
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
  });
}

export { SAFE_ERROR };
