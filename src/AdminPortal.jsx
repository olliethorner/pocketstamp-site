import { useEffect, useMemo, useState } from "react";

const ADMIN_API_BASE_URL = import.meta.env.VITE_POCKETSTAMP_BACKEND_URL;
const ADMIN_API_SECRET = import.meta.env.VITE_ADMIN_API_SECRET;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_SESSION_STORAGE_KEY = "pocketstampAdminSession";

const initialOnboardingForm = {
  cafeName: "",
  merchantSlug: "",
  locationName: "",
  address: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  salesNotes: "",
  rewardThreshold: 9,
  rewardText: "Collect 9 stamps and get your 10th coffee free.",
  programName: "",
  termsText: "",
  brandColor: "#26354f",
  backgroundColor: "#fff8ea",
  textColor: "#26211d",
  foregroundColor: "#26211d",
  labelColor: "#6f675d",
  passThemeMode: "premium_dark",
  passAccentColor: "#26354f",
  passStampEmptyColor: "#ffffff",
  passStampFilledColor: "#26354f",
  passLogoTileEnabled: true,
  passLogoTileColor: "#ffffff",
  passLogoFit: "contain",
  passDesignNotes: "",
  logoUpload: null,
  logoPreviewUrl: "",
  logoUrl: "",
  colorSuggestions: null,
  setupMode: "qr_only",
  staffDashboardAccess: true,
  createDemoCustomer: true,
};

const wizardSteps = [
  "Café details",
  "Loyalty offer",
  "Branding",
  "Hardware / setup",
  "Review",
];

const themeModeOptions = [
  ["premium_dark", "Premium dark (recommended)", "Recommended. Uses a premium darker Wallet card with café colour as an accent."],
  ["light_clean", "Light clean", "Uses a lighter card while keeping readability safe."],
  ["brand_bold", "Brand bold", "Uses more of the café brand colour while keeping contrast safe."],
  ["custom", "Custom", "Advanced. PocketStamp may still adjust unsafe colours for readability."],
];

const walletColorFields = [
  ["passAccentColor", "Accent colour"],
  ["backgroundColor", "Background colour"],
  ["foregroundColor", "Text colour"],
  ["labelColor", "Label colour"],
  ["passStampFilledColor", "Stamp filled colour"],
  ["passStampEmptyColor", "Stamp empty colour"],
  ["passLogoTileColor", "Logo tile colour"],
];

const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

function adminFetch(path, options = {}, accessToken = "") {
  if (!ADMIN_API_BASE_URL) {
    throw new Error("Missing VITE_POCKETSTAMP_BACKEND_URL.");
  }

  if (!accessToken && !ADMIN_API_SECRET) {
    throw new Error("Admin login is required.");
  }

  const authHeaders = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : { "x-pocketstamp-admin-secret": ADMIN_API_SECRET };

  return fetch(`${ADMIN_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  }).then(async (response) => {
    const text = await response.text();
    let payload = null;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { message: text };
    }

    if (!response.ok) {
      const error = new Error(
        payload?.error ||
          payload?.message ||
          payload?.details?.[0]?.message ||
          "The admin API returned an error.",
      );
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  });
}

function getStoredAdminSession() {
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeAdminSession(session) {
  window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

function normalizeSupabaseSession(payload) {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
    user: payload.user || null,
  };
}

async function supabaseTokenRequest(body) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${body.grant_type}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body.payload),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error_description || payload.msg || payload.message || "Unable to sign in.");
  }

  return normalizeSupabaseSession(payload);
}

function signInAdmin(email, password) {
  return supabaseTokenRequest({
    grant_type: "password",
    payload: { email, password },
  });
}

function refreshAdminSession(refreshToken) {
  return supabaseTokenRequest({
    grant_type: "refresh_token",
    payload: { refresh_token: refreshToken },
  });
}

function safeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function makeLogoUpload(file, dataUrl) {
  if (!file || !dataUrl) return null;
  return {
    fileName: file.name,
    mimeType: file.type || "image/png",
    dataUrl,
  };
}

function formatDate(value) {
  if (!value) return "Not returned";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getMerchantId(merchant) {
  return pickFirst(merchant.id, merchant.merchantId, merchant._id, merchant.slug);
}

function getMerchantName(merchant) {
  return pickFirst(
    merchant.cafeName,
    merchant.displayName,
    merchant.merchantName,
    merchant.name,
    merchant.businessName,
    "Untitled café",
  );
}

function getMerchantSlug(merchant) {
  return pickFirst(merchant.merchantSlug, merchant.slug, merchant.handle);
}

function getContactEmail(merchant) {
  return pickFirst(merchant.contactEmail, merchant.contact?.email, merchant.email);
}

function getLogoUrl(merchant) {
  return pickFirst(merchant.logoUrl, merchant.logoPath, merchant.branding?.logoUrl, merchant.branding?.logoPath);
}

function getThemeWarnings(merchant = {}, payload = {}) {
  const warnings = pickFirst(
    merchant.themeWarnings,
    merchant.passThemeWarnings,
    merchant.walletTheme?.themeWarnings,
    merchant.walletTheme?.warnings,
    payload.themeWarnings,
    payload.passThemeWarnings,
    payload?.data?.themeWarnings,
    payload?.result?.themeWarnings,
  );

  if (Array.isArray(warnings)) return warnings.filter(Boolean);
  return warnings ? [String(warnings)] : [];
}

function normalizeWalletThemeState(merchant = {}) {
  const walletTheme = merchant.walletTheme || merchant.passTheme || merchant.branding?.walletTheme || {};
  const finalTheme = merchant.finalTheme || merchant.generatedTheme || walletTheme.final || {};

  return {
    passThemeMode: pickFirst(merchant.passThemeMode, walletTheme.passThemeMode, walletTheme.mode, "premium_dark"),
    passAccentColor: pickFirst(merchant.passAccentColor, walletTheme.passAccentColor, walletTheme.accentColor, merchant.brandColor, merchant.branding?.brandColor, ""),
    backgroundColor: pickFirst(merchant.backgroundColor, walletTheme.backgroundColor, merchant.branding?.backgroundColor, ""),
    foregroundColor: pickFirst(merchant.foregroundColor, walletTheme.foregroundColor, merchant.textColor, merchant.branding?.foregroundColor, merchant.branding?.textColor, ""),
    textColor: pickFirst(merchant.textColor, merchant.foregroundColor, walletTheme.foregroundColor, merchant.branding?.textColor, ""),
    labelColor: pickFirst(merchant.labelColor, walletTheme.labelColor, merchant.branding?.labelColor, ""),
    passStampFilledColor: pickFirst(merchant.passStampFilledColor, merchant.stampFilledColor, walletTheme.passStampFilledColor, walletTheme.stampFilledColor, ""),
    passStampEmptyColor: pickFirst(merchant.passStampEmptyColor, merchant.stampEmptyColor, walletTheme.passStampEmptyColor, walletTheme.stampEmptyColor, ""),
    passLogoTileEnabled: Boolean(pickFirst(merchant.passLogoTileEnabled, merchant.logoTileEnabled, walletTheme.passLogoTileEnabled, walletTheme.logoTileEnabled, false)),
    passLogoTileColor: pickFirst(merchant.passLogoTileColor, walletTheme.passLogoTileColor, walletTheme.logoTileColor, ""),
    passLogoFit: pickFirst(merchant.passLogoFit, merchant.logoFit, walletTheme.passLogoFit, walletTheme.logoFit, "contain"),
    passDesignNotes: pickFirst(merchant.passDesignNotes, walletTheme.passDesignNotes, walletTheme.designNotes, ""),
    finalBackgroundColor: pickFirst(merchant.finalBackgroundColor, finalTheme.finalBackgroundColor, finalTheme.backgroundColor, ""),
    finalForegroundColor: pickFirst(merchant.finalForegroundColor, finalTheme.finalForegroundColor, finalTheme.foregroundColor, finalTheme.textColor, ""),
    finalLabelColor: pickFirst(merchant.finalLabelColor, finalTheme.finalLabelColor, finalTheme.labelColor, ""),
    stampFilledColor: pickFirst(merchant.stampFilledColor, finalTheme.stampFilledColor, finalTheme.passStampFilledColor, ""),
    stampEmptyColor: pickFirst(merchant.stampEmptyColor, finalTheme.stampEmptyColor, finalTheme.passStampEmptyColor, ""),
    logoTileEnabled: Boolean(pickFirst(merchant.logoTileEnabled, finalTheme.logoTileEnabled, merchant.passLogoTileEnabled, walletTheme.logoTileEnabled, false)),
    logoFit: pickFirst(merchant.logoFit, finalTheme.logoFit, merchant.passLogoFit, walletTheme.logoFit, "contain"),
  };
}

function getColorWarnings(form) {
  return walletColorFields
    .filter(([name]) => form[name] && !hexColorPattern.test(form[name]))
    .map(([, label]) => `${label} should use #RRGGBB.`);
}

function safeHex(value, fallback) {
  return hexColorPattern.test(String(value || "")) ? value : fallback;
}

function getWalletPreviewTheme(form = {}) {
  return {
    backgroundColor: safeHex(pickFirst(form.finalBackgroundColor, form.backgroundColor), "#26354f"),
    foregroundColor: safeHex(pickFirst(form.finalForegroundColor, form.foregroundColor, form.textColor), "#ffffff"),
    labelColor: safeHex(pickFirst(form.finalLabelColor, form.labelColor), "#d8d2c5"),
    stampFilledColor: safeHex(pickFirst(form.stampFilledColor, form.passStampFilledColor, form.passAccentColor, form.brandColor), "#f0c36a"),
    stampEmptyColor: safeHex(pickFirst(form.stampEmptyColor, form.passStampEmptyColor), "#ffffff"),
    logoTileColor: safeHex(pickFirst(form.passLogoTileColor), "#ffffff"),
    accentColor: safeHex(pickFirst(form.passAccentColor, form.brandColor), "#f0c36a"),
  };
}

function extractMerchants(payload) {
  const candidates = [
    payload,
    payload?.merchants,
    payload?.cafes,
    payload?.items,
    payload?.data,
    payload?.data?.merchants,
    payload?.data?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function extractMerchant(payload) {
  return (
    payload?.merchant ||
    payload?.cafe ||
    payload?.result?.merchant ||
    payload?.data?.merchant ||
    payload?.data?.result?.merchant ||
    payload?.result ||
    payload?.data ||
    payload
  );
}

function extractLinks(payload, merchant = {}) {
  const links =
    payload?.links ||
    payload?.result?.links ||
    payload?.data?.links ||
    payload?.merchant?.links ||
    merchant.links ||
    {};
  const slug = getMerchantSlug(merchant);
  const origin = window.location.origin;

  return {
    joinUrl: pickFirst(
      links.joinUrl,
      payload?.joinUrl,
      payload?.result?.joinUrl,
      payload?.data?.joinUrl,
      payload?.data?.result?.joinUrl,
      merchant.joinUrl,
      slug ? `${origin}/join/${slug}` : null,
    ),
    merchantDashboardUrl: pickFirst(
      links.merchantDashboardUrl,
      payload?.merchantDashboardUrl,
      payload?.result?.merchantDashboardUrl,
      payload?.data?.merchantDashboardUrl,
      payload?.data?.result?.merchantDashboardUrl,
      merchant.merchantDashboardUrl,
      slug || getMerchantId(merchant) ? `${origin}/merchant` : null,
    ),
    merchantSetupUrl: pickFirst(
      links.merchantSetupUrl,
      payload?.merchantSetupUrl,
      payload?.result?.merchantSetupUrl,
      payload?.data?.merchantSetupUrl,
      payload?.data?.result?.merchantSetupUrl,
      merchant.merchantSetupUrl,
      merchant.merchantOwnerSetupUrl,
      merchant.ownerInviteUrl,
      merchant.setupUrl,
    ),
    staffDashboardUrl: pickFirst(
      links.staffDashboardUrl,
      payload?.staffDashboardUrl,
      payload?.result?.staffDashboardUrl,
      payload?.data?.staffDashboardUrl,
      payload?.data?.result?.staffDashboardUrl,
      merchant.staffDashboardUrl,
    ),
    demoPassUrl: pickFirst(
      links.demoPassUrl,
      payload?.demoPassUrl,
      payload?.result?.demoPassUrl,
      payload?.data?.demoPassUrl,
      payload?.data?.result?.demoPassUrl,
      merchant.demoPassUrl,
    ),
  };
}

function normalizeOnboardResponse(responseJson, formState = {}) {
  const response = responseJson || {};
  const data = response.data || {};
  const result = response.result || data.result || {};
  const welcomePack =
    response.welcomePack ||
    data.welcomePack ||
    result.welcomePack ||
    data.result?.welcomePack ||
    {};
  const merchant =
    response.merchant ||
    data.merchant ||
    result.merchant ||
    data.result?.merchant ||
    {};
  const links = {
    ...(response.links || {}),
    ...(data.links || {}),
    ...(result.links || {}),
    ...(welcomePack.links || {}),
    ...(merchant.links || {}),
  };
  const merchantId = pickFirst(
    response.merchantId,
    data.merchantId,
    result.merchantId,
    welcomePack.merchantId,
    merchant.merchantId,
    merchant.id,
    merchant._id,
  );
  const merchantSlug = pickFirst(
    response.merchantSlug,
    data.merchantSlug,
    result.merchantSlug,
    welcomePack.merchantSlug,
    merchant.merchantSlug,
    merchant.slug,
    merchant.handle,
  );
  const joinUrl = pickFirst(
    response.joinUrl,
    data.joinUrl,
    result.joinUrl,
    welcomePack.joinUrl,
    links.joinUrl,
    merchant.joinUrl,
    merchantSlug ? `${window.location.origin}/join/${merchantSlug}` : null,
  );
  const merchantDashboardUrl = pickFirst(
    response.merchantDashboardUrl,
    data.merchantDashboardUrl,
    result.merchantDashboardUrl,
    welcomePack.merchantDashboardUrl,
    links.merchantDashboardUrl,
    merchant.merchantDashboardUrl,
    merchantId || merchantSlug ? `${window.location.origin}/merchant` : null,
  );
  const staffDashboardUrl = pickFirst(
    response.staffDashboardUrl,
    data.staffDashboardUrl,
    result.staffDashboardUrl,
    welcomePack.staffDashboardUrl,
    links.staffDashboardUrl,
    merchant.staffDashboardUrl,
  );
  const demoPassUrl = pickFirst(
    response.demoPassUrl,
    data.demoPassUrl,
    result.demoPassUrl,
    welcomePack.demoPassUrl,
    links.demoPassUrl,
    merchant.demoPassUrl,
  );
  const merchantSetupUrl = pickFirst(
    response.merchantSetupUrl,
    data.merchantSetupUrl,
    result.merchantSetupUrl,
    welcomePack.merchantSetupUrl,
    links.merchantSetupUrl,
    merchant.merchantSetupUrl,
  );

  return {
    merchantId,
    merchantSlug,
    joinUrl,
    merchantDashboardUrl,
    merchantSetupUrl,
    merchantOwnerStatus: pickFirst(
      response.merchantOwnerStatus,
      data.merchantOwnerStatus,
      result.merchantOwnerStatus,
      merchant.merchantOwnerStatus,
    ),
    merchantOwnerInviteExpiresAt: pickFirst(
      response.merchantOwnerInviteExpiresAt,
      data.merchantOwnerInviteExpiresAt,
      result.merchantOwnerInviteExpiresAt,
      merchant.merchantOwnerInviteExpiresAt,
    ),
    staffDashboardUrl,
    demoPassUrl,
    welcomeEmailSubject: pickFirst(
      response.welcomeEmailSubject,
      data.welcomeEmailSubject,
      result.welcomeEmailSubject,
      welcomePack.welcomeEmailSubject,
      welcomePack.subject,
      buildWelcomeEmail(formState, { joinUrl, merchantDashboardUrl, merchantSetupUrl, staffDashboardUrl, demoPassUrl }).subject,
    ),
    welcomeEmailBody: pickFirst(
      response.welcomeEmailBody,
      data.welcomeEmailBody,
      result.welcomeEmailBody,
      welcomePack.welcomeEmailBody,
      welcomePack.body,
      buildWelcomeEmail(formState, { joinUrl, merchantDashboardUrl, merchantSetupUrl, staffDashboardUrl, demoPassUrl }).body,
    ),
    welcomeEmailText: pickFirst(
      response.welcomeEmailText,
      data.welcomeEmailText,
      result.welcomeEmailText,
      welcomePack.welcomeEmailText,
      welcomePack.text,
    ),
    welcomeEmailHtml: pickFirst(
      response.welcomeEmailHtml,
      data.welcomeEmailHtml,
      result.welcomeEmailHtml,
      welcomePack.welcomeEmailHtml,
      welcomePack.html,
    ),
  };
}

function buildWelcomeEmail(form, links) {
  const subject = `Welcome to PocketStamp, ${form.cafeName || "your café"}`;
  const body = [
    `Hi ${form.contactName || "there"},`,
    "",
    `${form.cafeName || "Your café"} is set up in PocketStamp.`,
    "",
    `Join URL: ${links.joinUrl || "Not returned"}`,
    `Merchant owner setup: ${links.merchantSetupUrl || "Ask PocketStamp to resend your setup link."}`,
    `Merchant dashboard after setup: ${links.merchantDashboardUrl || "Not returned"}`,
    links.staffDashboardUrl ? `Staff dashboard: ${links.staffDashboardUrl}` : "Staff accounts can be created later.",
    links.demoPassUrl ? `Demo pass: ${links.demoPassUrl}` : null,
    "",
    "Next step: create your merchant password, then test the customer Wallet flow.",
    "",
    "Thanks,",
    "PocketStamp",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { subject, body };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isFutureDate(value) {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() > Date.now();
}

function getWelcomeEmailFromPayload(payload, merchant = {}) {
  const response = payload || {};
  const data = response.data || {};
  const result = response.result || data.result || {};
  const welcomePack =
    response.welcomePack ||
    data.welcomePack ||
    result.welcomePack ||
    data.result?.welcomePack ||
    merchant.welcomePack ||
    {};

  return {
    subject: pickFirst(
      response.welcomeEmailSubject,
      data.welcomeEmailSubject,
      result.welcomeEmailSubject,
      welcomePack.welcomeEmailSubject,
      welcomePack.subject,
      merchant.welcomeEmailSubject,
    ),
    body: pickFirst(
      response.welcomeEmailBody,
      data.welcomeEmailBody,
      result.welcomeEmailBody,
      welcomePack.welcomeEmailBody,
      welcomePack.body,
      merchant.welcomeEmailBody,
    ),
    text: pickFirst(
      response.welcomeEmailText,
      data.welcomeEmailText,
      result.welcomeEmailText,
      welcomePack.welcomeEmailText,
      welcomePack.text,
      merchant.welcomeEmailText,
    ),
    html: pickFirst(
      response.welcomeEmailHtml,
      data.welcomeEmailHtml,
      result.welcomeEmailHtml,
      welcomePack.welcomeEmailHtml,
      welcomePack.html,
      merchant.welcomeEmailHtml,
    ),
  };
}

function buildDetailWelcomeEmail(payload, merchant, links, ownerInviteUrl = "") {
  const backendEmail = getWelcomeEmailFromPayload(payload, merchant);
  const setupUrl = pickFirst(ownerInviteUrl, links.merchantSetupUrl);
  const ownerStatus = String(pickFirst(merchant.merchantOwnerStatus, merchant.ownerStatus, "")).toLowerCase();
  const inviteExpiresAt = pickFirst(merchant.merchantOwnerInviteExpiresAt, merchant.ownerInviteExpiresAt);
  const hasValidSetupUrl = Boolean(setupUrl && isFutureDate(inviteExpiresAt));
  const isOwnerActive = Boolean(
    merchant.merchantOwnerActivatedAt ||
      merchant.ownerActivatedAt ||
      merchant.merchantOwnerIsActive ||
      ownerStatus === "active" ||
      ownerStatus === "activated",
  );
  const needsSetupLink = !isOwnerActive && !hasValidSetupUrl;
  const cafeName = getMerchantName(merchant);
  const contactName = pickFirst(merchant.contactName, merchant.contact?.name, "there");
  const subject = pickFirst(backendEmail.subject, `Welcome to PocketStamp, ${cafeName}`);
  const primaryLabel = isOwnerActive ? "Open merchant dashboard" : "Set up merchant dashboard";
  const primaryUrl = isOwnerActive ? links.merchantDashboardUrl : setupUrl;
  const source = backendEmail.html || backendEmail.text || backendEmail.body ? "backend response" : "frontend detail data";
  const status = needsSetupLink ? "Regenerate setup link before resending" : "Ready to send";
  const note = needsSetupLink
    ? "Regenerate setup link before sending this email."
    : isOwnerActive
      ? "Your merchant dashboard is ready."
      : "Set up merchant dashboard";

  if (needsSetupLink) {
    return {
      subject,
      body: note,
      text: note,
      html: "",
      setupUrl: "",
      source,
      status,
      note,
      canSend: false,
    };
  }

  if (backendEmail.html || backendEmail.text || backendEmail.body) {
    const text = pickFirst(backendEmail.text, backendEmail.body, subject);
    return {
      subject,
      body: pickFirst(backendEmail.body, backendEmail.text, subject),
      text,
      html: backendEmail.html,
      setupUrl: hasValidSetupUrl ? setupUrl : "",
      source,
      status,
      note,
      canSend: true,
    };
  }

  const text = [
    `Hi ${contactName},`,
    "",
    `${cafeName} is set up in PocketStamp.`,
    "",
    isOwnerActive ? "Your merchant dashboard is ready." : "Set up merchant dashboard:",
    primaryUrl || "Not returned",
    "",
    `Customer join page: ${links.joinUrl || "Not returned"}`,
    `Merchant dashboard: ${links.merchantDashboardUrl || "Not returned"}`,
    links.demoPassUrl ? `Demo pass: ${links.demoPassUrl}` : null,
    "Staff accounts can be created later.",
    "",
    "Thanks,",
    "PocketStamp",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const brandColor = pickFirst(merchant.brandColor, merchant.branding?.brandColor, "#26354f");
  const backgroundColor = pickFirst(merchant.backgroundColor, merchant.branding?.backgroundColor, "#fff8ea");
  const textColor = pickFirst(merchant.textColor, merchant.branding?.textColor, "#26211d");
  const logoUrl = getLogoUrl(merchant);
  const html = `
    <div style="margin:0;padding:0;background:${escapeHtml(backgroundColor)};font-family:Arial,Helvetica,sans-serif;color:${escapeHtml(textColor)};">
      <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
        <div style="background:#ffffff;border:1px solid #eee4d3;border-radius:18px;overflow:hidden;">
          <div style="background:${escapeHtml(brandColor)};padding:26px;color:#ffffff;">
            ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(cafeName)}" style="display:block;max-width:140px;max-height:58px;margin-bottom:18px;">` : ""}
            <h1 style="margin:0;font-size:26px;line-height:1.25;">Welcome to PocketStamp</h1>
            <p style="margin:10px 0 0;font-size:16px;line-height:1.5;">${escapeHtml(cafeName)} is ready.</p>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${escapeHtml(contactName)},</p>
            <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">${escapeHtml(note)}</p>
            ${primaryUrl ? `<p style="margin:0 0 24px;"><a href="${escapeHtml(primaryUrl)}" style="display:inline-block;border-radius:999px;background:${escapeHtml(brandColor)};color:#ffffff;text-decoration:none;font-weight:700;padding:13px 20px;">${escapeHtml(primaryLabel)}</a></p>` : ""}
            <div style="background:#fbfaf7;border:1px solid #eee4d3;border-radius:14px;padding:18px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;text-transform:uppercase;color:#6f675d;">Useful links</p>
              <p style="margin:0 0 10px;font-size:15px;line-height:1.5;"><strong>Customer join page:</strong><br><a href="${escapeHtml(links.joinUrl)}" style="color:${escapeHtml(brandColor)};">${escapeHtml(links.joinUrl || "Not returned")}</a></p>
              <p style="margin:0 0 10px;font-size:15px;line-height:1.5;"><strong>Merchant dashboard:</strong><br><a href="${escapeHtml(links.merchantDashboardUrl)}" style="color:${escapeHtml(brandColor)};">${escapeHtml(links.merchantDashboardUrl || "Not returned")}</a></p>
              ${!isOwnerActive && setupUrl ? `<p style="margin:0 0 10px;font-size:15px;line-height:1.5;"><strong>Merchant owner setup:</strong><br><a href="${escapeHtml(setupUrl)}" style="color:${escapeHtml(brandColor)};">${escapeHtml(setupUrl)}</a></p>` : ""}
              ${links.demoPassUrl ? `<p style="margin:0 0 10px;font-size:15px;line-height:1.5;"><strong>Demo pass:</strong><br><a href="${escapeHtml(links.demoPassUrl)}" style="color:${escapeHtml(brandColor)};">${escapeHtml(links.demoPassUrl)}</a></p>` : ""}
              <p style="margin:0;font-size:15px;line-height:1.5;">Staff accounts can be created later.</p>
            </div>
            <p style="margin:24px 0 0;font-size:16px;line-height:1.6;">Thanks,<br>PocketStamp</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    subject,
    body: text,
    text,
    html,
    setupUrl: hasValidSetupUrl ? setupUrl : "",
    source,
    status,
    note,
    canSend: true,
  };
}

async function copyRichEmailToClipboard({ html = "", text = "" }) {
  if (html && navigator.clipboard?.write && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return "rich";
    } catch {
      // Fall back to plain text when rich clipboard writes are blocked or unsupported.
    }
  }

  await navigator.clipboard.writeText(text);
  return "plain";
}

function AdminShell({ children, active, adminContext, onLogout }) {
  const navItems = [
    ["/admin/onboard", "Onboard Café"],
    ["/admin/cafes", "Cafés"],
    ["/admin/account", "My Account"],
  ];

  return (
    <main className="ps-dashboard min-h-screen text-[var(--ps-espresso)]">
      <header className="border-b border-[var(--ps-border)] bg-[rgba(255,253,248,0.92)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <a href="/admin/onboard" className="flex items-center gap-3 text-[var(--ps-espresso)] no-underline">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ps-espresso)] text-sm font-bold text-white">
              PS
            </span>
            <span>
              <span className="block text-lg font-semibold">PocketStamp Admin</span>
              <span className="block text-sm text-[var(--ps-muted)]">Internal sales portal</span>
            </span>
          </a>

          <div className="flex flex-col gap-3 lg:items-end">
            <nav className="flex flex-wrap gap-2">
              {navItems.map(([href, label]) => {
                const isActive = active === href;
                return (
                  <a
                    key={href}
                    href={href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold no-underline transition ${
                      isActive
                        ? "bg-[var(--ps-blue)] text-white"
                        : "border border-[var(--ps-border)] bg-[var(--ps-card)] text-[var(--ps-espresso)] hover:border-stone-300"
                    }`}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>
            {adminContext ? (
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ps-muted)]">
                <span>
                  {adminContext.fullName || adminContext.email} · {adminContext.role}
                </span>
                <button type="button" onClick={onLogout} className="font-semibold text-[var(--ps-blue)]">
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--ps-espresso)]">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function TextInput({ multiline = false, ...props }) {
  const className = "ps-input min-h-[2.9rem]";

  if (multiline) {
    return <textarea {...props} rows={props.rows || 4} className={className} />;
  }

  return <input {...props} className={className} />;
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "Not set"}
      </p>
    </div>
  );
}

function Alert({ tone = "amber", children }) {
  const classes =
    tone === "red"
      ? "bg-red-50 text-red-700 ring-red-100"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : "bg-amber-50 text-amber-800 ring-amber-100";

  return <div className={`rounded-xl p-4 text-sm font-semibold ring-1 ${classes}`}>{children}</div>;
}

function ColorInput({ value, onChange }) {
  const colorValue = hexColorPattern.test(String(value || "")) ? value : "#26354f";

  return (
    <div className="grid grid-cols-[3rem_1fr] gap-2">
      <input
        type="color"
        value={colorValue}
        onChange={(event) => onChange(event.target.value)}
        className="h-[2.9rem] w-12 rounded-xl border border-slate-200 bg-white p-1"
      />
      <TextInput value={value || ""} placeholder="#26354f" onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function WalletDesignFields({ form, isEditing = true, onChange }) {
  const colorWarnings = getColorWarnings(form);
  const selectedMode = themeModeOptions.find(([value]) => value === form.passThemeMode) || themeModeOptions[0];

  return (
    <div className="grid gap-5">
      <div>
        <Field label="Theme style">
          {isEditing ? (
            <select
              value={form.passThemeMode || "premium_dark"}
              onChange={(event) => onChange("passThemeMode", event.target.value)}
              className="ps-input min-h-[2.9rem]"
            >
              {themeModeOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          ) : (
            <div className="rounded-xl bg-[#fbfaf7] p-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
              {selectedMode[1]}
            </div>
          )}
        </Field>
        <p className="mt-2 text-sm leading-6 text-slate-500">{selectedMode[2]}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {walletColorFields.map(([name, label]) => (
          <Field key={name} label={label}>
            {isEditing ? (
              <ColorInput value={form[name] || ""} onChange={(value) => onChange(name, value)} />
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-[#fbfaf7] p-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
                {form[name] && hexColorPattern.test(form[name]) ? (
                  <span className="h-5 w-5 rounded-full ring-1 ring-slate-200" style={{ backgroundColor: form[name] }} />
                ) : null}
                <span>{form[name] || "Not returned"}</span>
              </div>
            )}
          </Field>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl bg-[#fbfaf7] p-4 font-semibold ring-1 ring-slate-100">
          <input
            type="checkbox"
            checked={Boolean(form.passLogoTileEnabled)}
            disabled={!isEditing}
            onChange={(event) => onChange("passLogoTileEnabled", event.target.checked)}
          />
          Logo tile enabled
        </label>
        <Field label="Logo fit">
          {isEditing ? (
            <select
              value={form.passLogoFit || "contain"}
              onChange={(event) => onChange("passLogoFit", event.target.value)}
              className="ps-input min-h-[2.9rem]"
            >
              <option value="contain">contain</option>
              <option value="cover">cover</option>
            </select>
          ) : (
            <div className="rounded-xl bg-[#fbfaf7] p-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
              {form.passLogoFit || "Not returned"}
            </div>
          )}
        </Field>
      </div>

      <Field label="Optional design notes">
        {isEditing ? (
          <TextInput multiline value={form.passDesignNotes || ""} onChange={(event) => onChange("passDesignNotes", event.target.value)} />
        ) : (
          <div className="rounded-xl bg-[#fbfaf7] p-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
            {form.passDesignNotes || "Not returned"}
          </div>
        )}
      </Field>

      <div className="rounded-xl bg-[#fbfaf7] p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">
        <p className="font-semibold text-slate-800">PocketStamp automatically corrects colours that are hard to read in Apple Wallet.</p>
        <p className="mt-2">The card must stay readable. STAMPS, CUSTOMER, REWARD, and QR are fixed Wallet card elements. Unsafe contrast may be auto-corrected by PocketStamp.</p>
        <p className="mt-2">Staff accounts are separate and not part of Wallet card design.</p>
      </div>

      {colorWarnings.length ? (
        <Alert>
          <ul className="space-y-1">
            {colorWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Alert>
      ) : null}
    </div>
  );
}

function WalletPassPreview({ form }) {
  const threshold = Number(form.rewardThreshold) || 9;
  const logoSrc = form.logoPreviewUrl || form.logoUrl;
  const theme = getWalletPreviewTheme(form);
  const stampCount = Math.min(Math.max(threshold, 1), 12);

  return (
    <div
      className="mx-auto w-full max-w-sm overflow-hidden rounded-[1.75rem] p-5 shadow-2xl shadow-stone-900/10 ring-1 ring-stone-200"
      style={{ backgroundColor: theme.backgroundColor, color: theme.foregroundColor }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase" style={{ color: theme.labelColor }}>Apple Wallet</p>
          <p className="mt-2 truncate text-xl font-semibold">{form.cafeName || "Café name"}</p>
        </div>
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold"
          style={{ backgroundColor: form.passLogoTileEnabled || form.logoTileEnabled ? theme.logoTileColor : "transparent" }}
        >
          {logoSrc ? (
            <img src={logoSrc} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <span style={{ color: theme.accentColor }}>PS</span>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase" style={{ color: theme.labelColor }}>Stamps</p>
          <p className="mt-1 text-3xl font-semibold">0/{threshold}</p>
        </div>
        <p className="text-xs font-bold uppercase" style={{ color: theme.labelColor }}>Customer</p>
      </div>

      <div className="mt-5 grid grid-cols-6 gap-2" aria-label={`${stampCount} empty stamp circles`}>
        {Array.from({ length: stampCount }).map((_, index) => (
          <span
            key={index}
            className="aspect-square rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: index === 0 ? theme.stampFilledColor : theme.stampEmptyColor }}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-[1fr_4.5rem] gap-4 border-t border-white/20 pt-5">
        <div>
          <p className="text-xs font-bold uppercase" style={{ color: theme.labelColor }}>Reward</p>
          <p className="mt-1 text-sm font-semibold leading-5">{form.rewardText || "Reward text"}</p>
        </div>
        <div className="grid aspect-square place-items-center rounded-lg bg-white text-[10px] font-bold text-slate-400">
          QR
        </div>
      </div>
    </div>
  );
}

function FinalThemeDebug({ form, warnings = [] }) {
  const rows = [
    ["Final background", form.finalBackgroundColor],
    ["Final text", form.finalForegroundColor],
    ["Final label", form.finalLabelColor],
    ["Final stamp filled", form.stampFilledColor],
    ["Final stamp empty", form.stampEmptyColor],
    ["Logo tile enabled", form.logoTileEnabled === undefined ? "" : String(Boolean(form.logoTileEnabled))],
    ["Logo fit", form.logoFit],
  ];

  const hasValues = rows.some(([, value]) => value !== undefined && value !== null && value !== "") || warnings.length;
  if (!hasValues) return null;

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold">Generated theme</h2>
      {warnings.length ? (
        <div className="mt-4">
          <Alert>
            <ul className="space-y-1">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Alert>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <Detail key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function OnboardCafePage({ accessToken, adminContext, onLogout }) {
  const [form, setForm] = useState(initialOnboardingForm);
  const [step, setStep] = useState(0);
  const [slugEdited, setSlugEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdPayload, setCreatedPayload] = useState(null);
  const [copyState, setCopyState] = useState("");

  const warnings = useMemo(() => {
    const items = [];
    if (!ADMIN_API_BASE_URL) items.push("VITE_POCKETSTAMP_BACKEND_URL is missing.");
    if (!form.cafeName.trim()) items.push("Café name is required.");
    if (!form.merchantSlug.trim()) items.push("Merchant slug is required.");
    if (!form.locationName.trim()) items.push("Location name is required.");
    if (!form.contactEmail.trim()) items.push("Contact email is required.");
    if (!Number(form.rewardThreshold) || Number(form.rewardThreshold) < 1) {
      items.push("Reward threshold must be at least 1.");
    }
    return items;
  }, [form]);

  const normalizedCreated = normalizeOnboardResponse(createdPayload || {}, form);
  const welcomeEmail = {
    subject: normalizedCreated.welcomeEmailSubject,
    body: normalizedCreated.welcomeEmailBody,
    text: pickFirst(normalizedCreated.welcomeEmailText, normalizedCreated.welcomeEmailBody),
    html: normalizedCreated.welcomeEmailHtml,
  };
  const missingCreatedSlug = createdPayload && !normalizedCreated.merchantSlug;

  async function handleLogoFile(file) {
    if (!file) return;
    setError("");

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const logoUpload = makeLogoUpload(file, dataUrl);
      updateField("logoUpload", logoUpload);
      updateField("logoPreviewUrl", dataUrl);
      const payload = await adminFetch("/api/admin/logo-suggestions", {
        method: "POST",
        body: JSON.stringify({ logoUpload }),
      }, accessToken);
      updateField("colorSuggestions", payload?.suggestions || null);
    } catch (logoError) {
      setError(logoError.message || "Unable to read logo.");
    }
  }

  function applyColorSuggestions() {
    const suggestions = form.colorSuggestions;
    if (!suggestions) return;
    setForm((current) => ({
      ...current,
      brandColor: suggestions.brandColor || current.brandColor,
      passAccentColor: suggestions.brandColor || current.passAccentColor,
      backgroundColor: suggestions.backgroundColor || current.backgroundColor,
      textColor: suggestions.textColor || current.textColor,
      foregroundColor: suggestions.textColor || current.foregroundColor,
      labelColor: suggestions.labelColor || current.labelColor,
    }));
  }

  function updateField(name, value) {
    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "cafeName" && !slugEdited) {
        next.merchantSlug = safeSlug(value);
      }

      if (name === "merchantSlug") {
        next.merchantSlug = safeSlug(value);
      }

      if (name === "foregroundColor") {
        next.textColor = value;
      }

      if (name === "textColor") {
        next.foregroundColor = value;
      }

      return next;
    });
  }

  async function handleSubmit() {
    setError("");

    if (warnings.length) {
      setError("Fix the validation warnings before creating this café.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await adminFetch("/api/admin/onboard-merchant", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          rewardThreshold: Number(form.rewardThreshold),
        }),
      }, accessToken);
      const normalized = normalizeOnboardResponse(payload || {}, form);
      if (import.meta.env.DEV) {
        console.log("Admin onboard response", payload);
        console.log("Normalized admin onboard response", normalized);
      }
      setCreatedPayload(payload || {});
      setStep(5);
    } catch (submitError) {
      const details = submitError.payload?.details || submitError.payload?.errors;
      const detailText = Array.isArray(details)
        ? details.map((item) => item.message || item.error || String(item)).join(" ")
        : "";
      setError(
        [submitError.message, detailText].filter(Boolean).join(" ") ||
          "Unable to create café merchant.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyText(label, value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(`${label} copied`);
    } catch {
      setCopyState(`${label} copy failed`);
    }
    window.setTimeout(() => setCopyState(""), 1800);
  }

  async function copyWelcomeEmail() {
    const html = welcomeEmail.html || "";
    const text = welcomeEmail.text || "";

    try {
      const copyMode = await copyRichEmailToClipboard({ html, text });
      setCopyState(copyMode === "rich" ? "Branded welcome email copied." : "Plain text welcome email copied.");
    } catch {
      setCopyState("Welcome email copy failed.");
    }
    window.setTimeout(() => setCopyState(""), 1800);
  }

  function resetWizard() {
    setForm(initialOnboardingForm);
    setStep(0);
    setSlugEdited(false);
    setError("");
    setCreatedPayload(null);
  }

  if (step === 5) {
    return (
      <AdminShell active="/admin/onboard" adminContext={adminContext} onLogout={onLogout}>
        <section className="ps-flow-card">
          <p className="ps-eyebrow">Success / handoff</p>
          <h1 className="mt-3 text-3xl font-semibold">Café merchant created</h1>
          <p className="mt-2 text-[var(--ps-muted)]">
            Handoff links and starter email are ready for {form.cafeName}.
          </p>

          {missingCreatedSlug ? (
            <div className="mt-5">
              <Alert tone="amber">
                Merchant created, but no slug was returned. Check backend response.
                {normalizedCreated.merchantId ? ` Merchant ID: ${normalizedCreated.merchantId}` : ""}
              </Alert>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Detail label="Merchant ID" value={normalizedCreated.merchantId} />
            <Detail label="Merchant slug" value={normalizedCreated.merchantSlug} />
            <Detail label="Join URL" value={normalizedCreated.joinUrl} />
            <Detail label="Merchant owner setup URL" value={normalizedCreated.merchantSetupUrl} />
            <Detail label="Merchant dashboard URL after setup" value={normalizedCreated.merchantDashboardUrl} />
            <Detail label="Merchant owner status" value={normalizedCreated.merchantOwnerStatus} />
            <Detail label="Owner invite expires" value={formatDate(normalizedCreated.merchantOwnerInviteExpiresAt)} />
            <Detail label="Staff dashboard URL" value={normalizedCreated.staffDashboardUrl || "Staff accounts can be created later"} />
            <Detail label="Demo pass URL" value={normalizedCreated.demoPassUrl} />
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <Detail label="Welcome email subject" value={welcomeEmail.subject} />
            {welcomeEmail.html ? (
              <div className="mt-4 overflow-hidden rounded-xl bg-[#fbfaf7] ring-1 ring-slate-100">
                <iframe
                  title="Branded welcome email preview"
                  srcDoc={welcomeEmail.html}
                  sandbox=""
                  className="h-[520px] w-full bg-white"
                />
              </div>
            ) : (
              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[#fbfaf7] p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-100">
                {welcomeEmail.body}
              </pre>
            )}
          </div>

          {copyState ? <p className="mt-4 text-sm font-semibold text-[var(--ps-blue)]">{copyState}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => copyText("Join URL", normalizedCreated.joinUrl)}
              className="ps-button-primary"
            >
              Copy join URL
            </button>
            {normalizedCreated.merchantSetupUrl ? (
              <button
                type="button"
                onClick={() => copyText("Merchant setup URL", normalizedCreated.merchantSetupUrl)}
                className="ps-button-secondary"
              >
                Copy merchant setup URL
              </button>
            ) : null}
            <button
              type="button"
              onClick={copyWelcomeEmail}
              className="ps-button-secondary"
            >
              Copy welcome email
            </button>
            <a href={normalizedCreated.joinUrl} target="_blank" rel="noreferrer" className="ps-button-secondary">
              Open join page
            </a>
            <button type="button" onClick={resetWizard} className="ps-button-secondary">
              Create another café
            </button>
            <a href="/admin/cafes" className="ps-button-secondary">
              Go to cafés list
            </a>
          </div>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell active="/admin/onboard" adminContext={adminContext} onLogout={onLogout}>
      <div className="grid gap-6 lg:grid-cols-[0.72fr_0.28fr]">
        <section className="ps-flow-card">
          <p className="ps-eyebrow">Onboard café</p>
          <h1 className="mt-3 text-3xl font-semibold">{wizardSteps[step]}</h1>

          <div className="mt-6 flex flex-wrap gap-2">
            {wizardSteps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  index === step
                    ? "bg-[var(--ps-blue)] text-white"
                    : "bg-white text-slate-500 ring-1 ring-slate-200"
                }`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {step === 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Café name">
                  <TextInput value={form.cafeName} onChange={(event) => updateField("cafeName", event.target.value)} />
                </Field>
                <Field label="Merchant slug">
                  <TextInput
                    value={form.merchantSlug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      updateField("merchantSlug", event.target.value);
                    }}
                  />
                </Field>
                <Field label="Location name">
                  <TextInput value={form.locationName} onChange={(event) => updateField("locationName", event.target.value)} />
                </Field>
                <Field label="Address">
                  <TextInput value={form.address} onChange={(event) => updateField("address", event.target.value)} />
                </Field>
                <Field label="Contact name">
                  <TextInput value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} />
                </Field>
                <Field label="Contact email">
                  <TextInput type="email" value={form.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} />
                </Field>
                <Field label="Contact phone">
                  <TextInput value={form.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} />
                </Field>
                <Field label="Sales notes">
                  <TextInput multiline value={form.salesNotes} onChange={(event) => updateField("salesNotes", event.target.value)} />
                </Field>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Reward threshold">
                  <TextInput
                    type="number"
                    min="1"
                    value={form.rewardThreshold}
                    onChange={(event) => updateField("rewardThreshold", event.target.value)}
                  />
                </Field>
                <Field label="Program name optional">
                  <TextInput value={form.programName} onChange={(event) => updateField("programName", event.target.value)} />
                </Field>
                <Field label="Reward text">
                  <TextInput multiline value={form.rewardText} onChange={(event) => updateField("rewardText", event.target.value)} />
                </Field>
                <Field label="Terms text optional">
                  <TextInput multiline value={form.termsText} onChange={(event) => updateField("termsText", event.target.value)} />
                </Field>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <div className="grid gap-5">
                  <Field label="Brand color">
                    <ColorInput value={form.brandColor} onChange={(value) => updateField("brandColor", value)} />
                  </Field>
                  <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                    <h2 className="text-xl font-semibold">Wallet card design</h2>
                    <div className="mt-5">
                      <WalletDesignFields form={form} onChange={updateField} />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                    <p className="text-sm font-semibold text-[var(--ps-espresso)]">Logo</p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(event) => handleLogoFile(event.target.files?.[0])}
                      className="mt-3 block w-full text-sm"
                    />
                    {form.logoPreviewUrl ? (
                      <img src={form.logoPreviewUrl} alt="" className="mt-4 max-h-24 rounded-lg bg-[#fbfaf7] object-contain p-3 ring-1 ring-slate-100" />
                    ) : null}
                    {form.colorSuggestions ? (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold text-slate-500">Suggested only. Current colours stay unchanged unless applied.</p>
                        <div className="flex flex-wrap gap-2">
                          {(form.colorSuggestions.palette || []).map((color) => (
                            <span key={color} className="h-7 w-7 rounded-full ring-1 ring-slate-200" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <button type="button" onClick={applyColorSuggestions} className="ps-button-secondary mt-3">
                          Apply suggested colours
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <WalletPassPreview form={form} />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-5">
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-[var(--ps-espresso)]">Setup mode</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      ["qr_only", "QR only"],
                      ["vtap_later", "vTap later"],
                    ].map(([value, label]) => (
                      <label key={value} className="flex items-center gap-3 rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
                        <input
                          type="radio"
                          name="setupMode"
                          value={value}
                          checked={form.setupMode === value}
                          onChange={(event) => updateField("setupMode", event.target.value)}
                        />
                        <span className="font-semibold">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-xl bg-white p-4 font-semibold ring-1 ring-slate-200">
                  <input
                    type="checkbox"
                    checked={form.staffDashboardAccess}
                    onChange={(event) => updateField("staffDashboardAccess", event.target.checked)}
                  />
                  Staff dashboard access
                </label>
                <label className="flex items-center gap-3 rounded-xl bg-white p-4 font-semibold ring-1 ring-slate-200">
                  <input
                    type="checkbox"
                    checked={form.createDemoCustomer}
                    onChange={(event) => updateField("createDemoCustomer", event.target.checked)}
                  />
                  Create demo customer
                </label>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                {warnings.length ? (
                  <Alert>
                    <ul className="space-y-1">
                      {warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </Alert>
                ) : (
                  <Alert tone="green">No validation warnings.</Alert>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <Detail label="Café name" value={form.cafeName} />
                  <Detail label="Slug" value={form.merchantSlug} />
                  <Detail label="Location" value={form.locationName} />
                  <Detail label="Address" value={form.address} />
                  <Detail label="Contact" value={`${form.contactName} ${form.contactEmail}`.trim()} />
                  <Detail label="Phone" value={form.contactPhone} />
                  <Detail label="Reward threshold" value={`${form.rewardThreshold} stamps`} />
                  <Detail label="Reward text" value={form.rewardText} />
                  <Detail label="Program name" value={form.programName} />
                  <Detail label="Terms" value={form.termsText} />
                  <Detail label="Setup mode" value={form.setupMode} />
                  <Detail label="Sales notes" value={form.salesNotes} />
                  <Detail label="Logo" value={form.logoUpload?.fileName || form.logoUrl} />
                  <Detail label="Wallet theme" value={themeModeOptions.find(([value]) => value === form.passThemeMode)?.[1]} />
                  <Detail label="Wallet accent" value={form.passAccentColor} />
                  <Detail label="Wallet text" value={form.foregroundColor} />
                  <Detail label="Wallet label" value={form.labelColor} />
                  <Detail label="Stamp filled" value={form.passStampFilledColor} />
                  <Detail label="Stamp empty" value={form.passStampEmptyColor} />
                  <Detail label="Logo tile" value={String(Boolean(form.passLogoTileEnabled))} />
                  <Detail label="Logo fit" value={form.passLogoFit} />
                  <Detail label="Design notes" value={form.passDesignNotes} />
                </div>
              </div>
            ) : null}
          </div>

          {error ? <div className="mt-6"><Alert tone="red">{error}</Alert></div> : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              className="ps-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(current + 1, 4))}
                className="ps-button-primary"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="ps-button-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating café..." : "Create Café Merchant"}
              </button>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="ps-dashboard-card rounded-2xl p-5">
            <p className="text-sm font-semibold text-[var(--ps-muted)]">Current slug</p>
            <p className="mt-2 break-all text-lg font-semibold">{form.merchantSlug || "not-set"}</p>
          </div>
          <div className="ps-dashboard-card rounded-2xl p-5">
            <p className="text-sm font-semibold text-[var(--ps-muted)]">Offer</p>
            <p className="mt-2 text-lg font-semibold">{form.rewardThreshold || 9} stamp reward</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ps-muted)]">{form.rewardText}</p>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function CafesListPage({ accessToken, adminContext, onLogout }) {
  const [merchants, setMerchants] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMerchants() {
      setIsLoading(true);
      setError("");

      try {
        const payload = await adminFetch("/api/admin/merchants", {}, accessToken);
        if (isMounted) setMerchants(extractMerchants(payload));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || "Unable to load cafés.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMerchants();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const filteredMerchants = merchants.filter((merchant) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;

    return [getMerchantName(merchant), getMerchantSlug(merchant), getContactEmail(merchant)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });

  return (
    <AdminShell active="/admin/cafes" adminContext={adminContext} onLogout={onLogout}>
      <section className="ps-flow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ps-eyebrow">Cafés</p>
            <h1 className="mt-3 text-3xl font-semibold">
              {adminContext?.role === "owner" ? "All cafés" : "Your onboarded cafés"}
            </h1>
          </div>
          <label className="w-full lg:max-w-sm">
            <span className="sr-only">Search cafés</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, slug or contact email"
              className="ps-input"
            />
          </label>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {isLoading ? (
            <div className="p-5 text-slate-600">Loading cafés...</div>
          ) : error ? (
            <div className="p-5"><Alert tone="red">{error}</Alert></div>
          ) : !filteredMerchants.length ? (
            <div className="p-5 text-slate-600">No cafés found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-[#fbfaf7] text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Café name</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Created by</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMerchants.map((merchant) => {
                    const merchantId = getMerchantId(merchant);
                    return (
                      <tr key={merchantId} className="align-top">
                        <td className="px-4 py-4 font-semibold text-slate-950">{getMerchantName(merchant)}</td>
                        <td className="px-4 py-4 text-slate-600">{getMerchantSlug(merchant)}</td>
                        <td className="px-4 py-4 text-slate-600">{getContactEmail(merchant) || "Not returned"}</td>
                        <td className="px-4 py-4 text-slate-600">{pickFirst(merchant.status, merchant.state, "Not returned")}</td>
                        <td className="px-4 py-4 text-slate-600">{formatDate(pickFirst(merchant.createdAt, merchant.created_at))}</td>
                        <td className="px-4 py-4 text-slate-600">{pickFirst(merchant.createdByEmail, merchant.createdBy, merchant.created_by, "Not returned")}</td>
                        <td className="px-4 py-4">
                          <a href={`/admin/cafes/${merchantId}`} className="font-semibold text-[var(--ps-blue)] no-underline">
                            View/Edit
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function MerchantDetailPage({ merchantId, accessToken, adminContext, onLogout }) {
  const [merchant, setMerchant] = useState(null);
  const [detailPayload, setDetailPayload] = useState(null);
  const [form, setForm] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [detailCopyState, setDetailCopyState] = useState("");
  const [ownerInviteUrl, setOwnerInviteUrl] = useState("");
  const [isRegeneratingInvite, setIsRegeneratingInvite] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadMerchant() {
      setIsLoading(true);
      setError("");

      try {
        const payload = await adminFetch(`/api/admin/merchants/${merchantId}`, {}, accessToken);
        const nextMerchant = extractMerchant(payload);
        if (!isMounted) return;
        setDetailPayload(payload || {});
        setMerchant(nextMerchant);
        setForm({
          cafeName: getMerchantName(nextMerchant),
          contactName: pickFirst(nextMerchant.contactName, nextMerchant.contact?.name),
          contactEmail: getContactEmail(nextMerchant),
          contactPhone: pickFirst(nextMerchant.contactPhone, nextMerchant.contact?.phone),
          address: pickFirst(nextMerchant.address, nextMerchant.location?.address),
          salesNotes: pickFirst(nextMerchant.salesNotes, nextMerchant.notes),
          rewardThreshold: pickFirst(nextMerchant.rewardThreshold, nextMerchant.loyalty?.rewardThreshold),
          rewardText: pickFirst(nextMerchant.rewardText, nextMerchant.loyalty?.rewardText),
          brandColor: pickFirst(nextMerchant.brandColor, nextMerchant.branding?.brandColor),
          ...normalizeWalletThemeState(nextMerchant),
          status: pickFirst(nextMerchant.status, nextMerchant.state, "active"),
          logoUpload: null,
          logoPreviewUrl: "",
          logoUrl: getLogoUrl(nextMerchant),
          colorSuggestions: null,
        });
      } catch (loadError) {
        if (isMounted) setError(loadError.message || "Unable to load café.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMerchant();

    return () => {
      isMounted = false;
    };
  }, [merchantId, accessToken]);

  if (isLoading) {
    return (
      <AdminShell active="/admin/cafes" adminContext={adminContext} onLogout={onLogout}>
        <section className="ps-flow-card">Loading café...</section>
      </AdminShell>
    );
  }

  if (error || !merchant) {
    return (
      <AdminShell active="/admin/cafes" adminContext={adminContext} onLogout={onLogout}>
        <section className="ps-flow-card"><Alert tone="red">{error || "Café not found."}</Alert></section>
      </AdminShell>
    );
  }

  const links = extractLinks(detailPayload || {}, merchant);
  const welcomeEmail = buildDetailWelcomeEmail(detailPayload || {}, merchant, links, ownerInviteUrl);
  const themeWarnings = getThemeWarnings(merchant, detailPayload || {});
  const editableFields = [
    ["cafeName", "Café/display name", "text"],
    ["contactName", "Contact name", "text"],
    ["contactEmail", "Contact email", "email"],
    ["contactPhone", "Contact phone", "text"],
    ["address", "Address", "textarea"],
    ["salesNotes", "Notes", "textarea"],
    ["status", "Status", "text"],
    ["rewardThreshold", "Reward threshold", "number"],
    ["rewardText", "Reward text", "textarea"],
    ["brandColor", "Brand color", "color"],
    ["backgroundColor", "Background color", "color"],
    ["textColor", "Text color", "color"],
  ];

  function updateForm(name, value) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "foregroundColor") next.textColor = value;
      if (name === "textColor") next.foregroundColor = value;
      return next;
    });
  }

  async function handleDetailLogoFile(file) {
    if (!file) return;
    setError("");

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const logoUpload = makeLogoUpload(file, dataUrl);
      setForm((current) => ({
        ...current,
        logoUpload,
        logoPreviewUrl: dataUrl,
      }));
      const payload = await adminFetch("/api/admin/logo-suggestions", {
        method: "POST",
        body: JSON.stringify({ logoUpload }),
      }, accessToken);
      setForm((current) => ({
        ...current,
        colorSuggestions: payload?.suggestions || null,
      }));
    } catch (logoError) {
      setError(logoError.message || "Unable to read logo.");
    }
  }

  function applyDetailColorSuggestions() {
    const suggestions = form.colorSuggestions;
    if (!suggestions) return;
    setForm((current) => ({
      ...current,
      brandColor: suggestions.brandColor || current.brandColor,
      passAccentColor: suggestions.brandColor || current.passAccentColor,
      backgroundColor: suggestions.backgroundColor || current.backgroundColor,
      textColor: suggestions.textColor || current.textColor,
      foregroundColor: suggestions.textColor || current.foregroundColor,
      labelColor: suggestions.labelColor || current.labelColor,
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const payload = await adminFetch(`/api/admin/merchants/${merchantId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          rewardThreshold: form.rewardThreshold ? Number(form.rewardThreshold) : undefined,
        }),
      }, accessToken);
      const nextMerchant = extractMerchant(payload);
      setDetailPayload(payload || detailPayload);
      setMerchant(nextMerchant || { ...merchant, ...form });
      if (nextMerchant) {
        setForm((current) => ({
          ...current,
          cafeName: getMerchantName(nextMerchant),
          contactName: pickFirst(nextMerchant.contactName, nextMerchant.contact?.name),
          contactEmail: getContactEmail(nextMerchant),
          contactPhone: pickFirst(nextMerchant.contactPhone, nextMerchant.contact?.phone),
          address: pickFirst(nextMerchant.address, nextMerchant.location?.address),
          salesNotes: pickFirst(nextMerchant.salesNotes, nextMerchant.notes),
          rewardThreshold: pickFirst(nextMerchant.rewardThreshold, nextMerchant.loyalty?.rewardThreshold),
          rewardText: pickFirst(nextMerchant.rewardText, nextMerchant.loyalty?.rewardText),
          brandColor: pickFirst(nextMerchant.brandColor, nextMerchant.branding?.brandColor),
          ...normalizeWalletThemeState(nextMerchant),
          status: pickFirst(nextMerchant.status, nextMerchant.state, "active"),
          logoUpload: null,
          logoPreviewUrl: "",
          logoUrl: getLogoUrl(nextMerchant),
          colorSuggestions: null,
        }));
      }
      setIsEditing(false);
      setSaveMessage("Saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save café.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRegenerateOwnerInvite() {
    setIsRegeneratingInvite(true);
    setError("");
    setSaveMessage("");

    try {
      const payload = await adminFetch(`/api/admin/merchants/${merchantId}/owner-invite`, {
        method: "POST",
        body: JSON.stringify({}),
      }, accessToken);
      const result = payload?.result || {};
      setOwnerInviteUrl(result.merchantSetupUrl || "");
      setDetailPayload(payload || detailPayload);
      if (result.merchant) setMerchant(result.merchant);
      setSaveMessage("Owner setup link regenerated.");
    } catch (inviteError) {
      setError(inviteError.message || "Unable to regenerate owner setup link.");
    } finally {
      setIsRegeneratingInvite(false);
    }
  }

  async function copyDetailWelcomeEmail() {
    if (!welcomeEmail.canSend) {
      setDetailCopyState("Regenerate setup link before resending.");
      window.setTimeout(() => setDetailCopyState(""), 1800);
      return;
    }

    try {
      const copyMode = await copyRichEmailToClipboard({
        html: welcomeEmail.html,
        text: welcomeEmail.text,
      });
      setDetailCopyState(copyMode === "rich" ? "Branded welcome email copied." : "Plain text welcome email copied.");
    } catch {
      setDetailCopyState("Welcome email copy failed.");
    }
    window.setTimeout(() => setDetailCopyState(""), 1800);
  }

  async function copyDetailPlainWelcomeEmail() {
    try {
      await navigator.clipboard.writeText(welcomeEmail.text || "");
      setDetailCopyState("Plain text welcome email copied.");
    } catch {
      setDetailCopyState("Welcome email copy failed.");
    }
    window.setTimeout(() => setDetailCopyState(""), 1800);
  }

  async function copyDetailSetupUrl() {
    try {
      await navigator.clipboard.writeText(welcomeEmail.setupUrl);
      setDetailCopyState("Merchant setup URL copied.");
    } catch {
      setDetailCopyState("Merchant setup URL copy failed.");
    }
    window.setTimeout(() => setDetailCopyState(""), 1800);
  }

  return (
    <AdminShell active="/admin/cafes" adminContext={adminContext} onLogout={onLogout}>
      <section className="ps-flow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="ps-eyebrow">Café detail</p>
            <h1 className="mt-3 text-3xl font-semibold">{getMerchantName(merchant)}</h1>
            <p className="mt-2 text-[var(--ps-muted)]">Slug and merchant ID are read-only in Stage 1.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className="ps-button-secondary"
          >
            {isEditing ? "Cancel edit" : "Edit café"}
          </button>
        </div>

        {saveMessage ? <p className="mt-4 text-sm font-semibold text-[var(--ps-blue)]">{saveMessage}</p> : null}
        {error ? <div className="mt-4"><Alert tone="red">{error}</Alert></div> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Detail label="Merchant ID" value={pickFirst(merchant.id, merchant.merchantId, merchant._id)} />
          <Detail label="Slug" value={getMerchantSlug(merchant)} />
          <Detail label="Status" value={pickFirst(merchant.status, merchant.state)} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">Links</h2>
              <div className="mt-4 grid gap-3">
                <Detail label="Join URL" value={links.joinUrl} />
                <Detail label="Merchant dashboard URL after setup" value={links.merchantDashboardUrl} />
                <Detail label="Staff dashboard URL" value={links.staffDashboardUrl || "Staff accounts can be created later"} />
                <Detail label="Demo pass URL" value={links.demoPassUrl} />
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">Merchant owner account</h2>
              <div className="mt-4 grid gap-3">
                <Detail label="Owner email" value={getContactEmail(merchant)} />
                <Detail label="Owner status" value={pickFirst(merchant.merchantOwnerStatus, "Not returned")} />
                <Detail label="Invite expires" value={formatDate(merchant.merchantOwnerInviteExpiresAt)} />
                <Detail label="Activated" value={formatDate(merchant.merchantOwnerActivatedAt)} />
                {ownerInviteUrl ? <Detail label="New setup URL" value={ownerInviteUrl} /> : null}
              </div>
              {merchant.merchantOwnerStatus === "invited" || merchant.merchantOwnerHasSetupInvite ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleRegenerateOwnerInvite}
                    disabled={isRegeneratingInvite}
                    className="ps-button-secondary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isRegeneratingInvite ? "Regenerating..." : "Regenerate setup link"}
                  </button>
                  {ownerInviteUrl ? (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(ownerInviteUrl)}
                      className="ps-button-secondary"
                    >
                      Copy setup URL
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="text-xl font-semibold">Welcome email</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    welcomeEmail.canSend
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
                  }`}
                >
                  {welcomeEmail.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <Detail label="Subject" value={welcomeEmail.subject} />
                <Detail label="Note" value={welcomeEmail.note} />
              </div>

              {welcomeEmail.canSend ? (
                welcomeEmail.html ? (
                  <div className="mt-4 overflow-hidden rounded-xl bg-[#fbfaf7] ring-1 ring-slate-100">
                    <iframe
                      title="Welcome email preview"
                      srcDoc={welcomeEmail.html}
                      sandbox=""
                      className="h-[520px] w-full bg-white"
                    />
                  </div>
                ) : (
                  <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[#fbfaf7] p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-100">
                    {welcomeEmail.text}
                  </pre>
                )
              ) : (
                <div className="mt-4">
                  <Alert>Regenerate setup link before sending this email.</Alert>
                </div>
              )}

              {detailCopyState ? (
                <p className="mt-4 text-sm font-semibold text-[var(--ps-blue)]">{detailCopyState}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyDetailWelcomeEmail}
                  disabled={!welcomeEmail.canSend}
                  className="ps-button-secondary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Copy welcome email
                </button>
                <button
                  type="button"
                  onClick={copyDetailPlainWelcomeEmail}
                  disabled={!welcomeEmail.canSend}
                  className="ps-button-secondary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Copy plain text
                </button>
                {welcomeEmail.setupUrl ? (
                  <button
                    type="button"
                    onClick={copyDetailSetupUrl}
                    className="ps-button-secondary"
                  >
                    Copy merchant setup URL
                  </button>
                ) : null}
                {!welcomeEmail.canSend || merchant.merchantOwnerStatus === "invited" || merchant.merchantOwnerHasSetupInvite ? (
                  <button
                    type="button"
                    onClick={handleRegenerateOwnerInvite}
                    disabled={isRegeneratingInvite}
                    className="ps-button-secondary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isRegeneratingInvite ? "Regenerating..." : "Regenerate setup link"}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">Overview</h2>
              <div className="mt-4 grid gap-3">
                <Detail label="Contact email" value={getContactEmail(merchant)} />
                <Detail label="Contact phone" value={pickFirst(merchant.contactPhone, merchant.contact?.phone)} />
                <Detail label="Address" value={pickFirst(merchant.address, merchant.location?.address)} />
                <Detail label="Reward" value={pickFirst(merchant.rewardText, merchant.loyalty?.rewardText)} />
                <Detail label="Notes" value={pickFirst(merchant.salesNotes, merchant.notes)} />
                <Detail label="Logo" value={getLogoUrl(merchant)} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[1fr_18rem]">
                <div>
                  <h2 className="text-xl font-semibold">Wallet card design</h2>
                  <div className="mt-5">
                    <WalletDesignFields form={form} isEditing={isEditing} onChange={updateForm} />
                  </div>
                </div>
                <WalletPassPreview form={form} />
              </div>
            </div>

            <FinalThemeDebug form={form} warnings={themeWarnings} />

            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">Safe fields</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {editableFields.map(([name, label, type]) => (
                  <Field key={name} label={label}>
                    {isEditing ? (
                      type === "color" ? (
                        <ColorInput value={form[name] || ""} onChange={(value) => updateForm(name, value)} />
                      ) : (
                        <TextInput
                          type={type === "textarea" ? undefined : type}
                          multiline={type === "textarea"}
                          value={form[name] || ""}
                          onChange={(event) => updateForm(name, event.target.value)}
                        />
                      )
                    ) : (
                      <div className="rounded-xl bg-[#fbfaf7] p-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
                        {form[name] || "Not returned"}
                      </div>
                    )}
                  </Field>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-[var(--ps-espresso)]">Logo</p>
                {form.logoPreviewUrl || form.logoUrl ? (
                  <img src={form.logoPreviewUrl || form.logoUrl} alt="" className="mt-3 max-h-24 rounded-lg bg-white object-contain p-3 ring-1 ring-slate-100" />
                ) : (
                  <p className="mt-2 text-sm font-semibold text-slate-500">No logo uploaded.</p>
                )}
                {isEditing ? (
                  <div className="mt-4">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(event) => handleDetailLogoFile(event.target.files?.[0])}
                      className="block w-full text-sm"
                    />
                    {form.colorSuggestions ? (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold text-slate-500">Suggested only. Current colours stay unchanged unless applied.</p>
                        <div className="flex flex-wrap gap-2">
                          {(form.colorSuggestions.palette || []).map((color) => (
                            <span key={color} className="h-7 w-7 rounded-full ring-1 ring-slate-200" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <button type="button" onClick={applyDetailColorSuggestions} className="ps-button-secondary mt-3">
                          Apply suggested colours
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {isEditing ? (
                <div className="mt-6">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSave}
                    className="ps-button-primary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function AdminLoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await onLogin(email, password);
    } catch (loginError) {
      setError(loginError.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ps-dashboard min-h-screen px-5 py-10 text-[var(--ps-espresso)]">
      <section className="ps-flow-card mx-auto max-w-xl">
        <p className="ps-eyebrow">PocketStamp Admin</p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
        <p className="mt-3 leading-7 text-[var(--ps-muted)]">
          Use your PocketStamp admin account.
        </p>

        {error ? <div className="mt-5"><Alert tone="red">{error}</Alert></div> : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <Field label="Email">
            <TextInput
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <button type="submit" disabled={isSubmitting} className="ps-button-primary disabled:opacity-70">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function AccountPage({ adminContext, onLogout }) {
  return (
    <AdminShell active="/admin/account" adminContext={adminContext} onLogout={onLogout}>
      <section className="ps-flow-card">
        <p className="ps-eyebrow">My Account</p>
        <h1 className="mt-3 text-3xl font-semibold">{adminContext.fullName || adminContext.email}</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Detail label="Email" value={adminContext.email} />
          <Detail label="Role" value={adminContext.role} />
          <Detail label="Status" value={adminContext.status} />
          <Detail label="Cafés visible" value={String(adminContext.cafesOnboarded ?? 0)} />
          <Detail label="Admin ID" value={adminContext.id || "Secret fallback"} />
          <Detail label="Created" value={formatDate(adminContext.createdAt)} />
        </div>
        <button type="button" onClick={onLogout} className="ps-button-secondary mt-6">
          Sign out
        </button>
      </section>
    </AdminShell>
  );
}

export default function AdminPortal({ path }) {
  const [session, setSession] = useState(() => getStoredAdminSession());
  const [adminContext, setAdminContext] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [authError, setAuthError] = useState("");

  const accessToken = session?.accessToken || "";

  function handleLogout() {
    clearAdminSession();
    setSession(null);
    setAdminContext(null);
    window.history.replaceState(null, "", "/admin/login");
  }

  async function loadAdminContext(nextSession) {
    const payload = await adminFetch("/api/admin/me", {}, nextSession.accessToken);
    const nextAdmin = payload?.admin;
    if (!nextAdmin) throw new Error("Admin profile was not returned.");
    setAdminContext(nextAdmin);
    return nextAdmin;
  }

  async function handleLogin(email, password) {
    const nextSession = await signInAdmin(email, password);
    try {
      await loadAdminContext(nextSession);
    } catch (error) {
      clearAdminSession();
      throw error;
    }
    storeAdminSession(nextSession);
    setSession(nextSession);
    window.history.replaceState(null, "", "/admin/onboard");
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      if (!session?.accessToken) {
        setIsBootstrapping(false);
        return;
      }

      try {
        let nextSession = session;
        if (session.refreshToken && session.expiresAt && session.expiresAt < Date.now() + 60000) {
          nextSession = await refreshAdminSession(session.refreshToken);
          storeAdminSession(nextSession);
          if (isMounted) setSession(nextSession);
        }

        await loadAdminContext(nextSession);
        if (isMounted) setAuthError("");
      } catch (error) {
        clearAdminSession();
        if (isMounted) {
          setSession(null);
          setAdminContext(null);
          setAuthError(error.message || "Admin login is required.");
        }
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isBootstrapping) {
    return (
      <main className="ps-dashboard min-h-screen px-5 py-10 text-[var(--ps-espresso)]">
        <section className="ps-flow-card mx-auto max-w-xl">Loading admin...</section>
      </main>
    );
  }

  if (!session?.accessToken || !adminContext) {
    return (
      <>
        {authError ? (
          <div className="ps-dashboard px-5 pt-5">
            <div className="mx-auto max-w-xl"><Alert tone="red">{authError}</Alert></div>
          </div>
        ) : null}
        <AdminLoginPage onLogin={handleLogin} />
      </>
    );
  }

  const pageProps = {
    accessToken,
    adminContext,
    onLogout: handleLogout,
  };

  if (path === "/admin") {
    window.history.replaceState(null, "", "/admin/onboard");
    return <OnboardCafePage {...pageProps} />;
  }

  if (path === "/admin/login") {
    window.history.replaceState(null, "", "/admin/onboard");
    return <OnboardCafePage {...pageProps} />;
  }

  if (path === "/admin/onboard") return <OnboardCafePage {...pageProps} />;
  if (path === "/admin/cafes") return <CafesListPage {...pageProps} />;
  if (path === "/admin/account") return <AccountPage adminContext={adminContext} onLogout={handleLogout} />;

  const detailMatch = path.match(/^\/admin\/cafes\/([^/]+)$/);
  if (detailMatch) {
    return <MerchantDetailPage merchantId={decodeURIComponent(detailMatch[1])} {...pageProps} />;
  }

  return (
    <AdminShell active="/admin/onboard" adminContext={adminContext} onLogout={handleLogout}>
      <section className="ps-flow-card">
        <h1 className="text-3xl font-semibold">Admin page not found</h1>
        <a href="/admin/onboard" className="ps-button-primary mt-6">
          Go to onboarding
        </a>
      </section>
    </AdminShell>
  );
}
