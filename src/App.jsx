import { Component, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import AdminPortal from "./AdminPortal.jsx";
import "./App.css";

const API_BASE_URL = "https://pocketstamp-wallet-backend-production.up.railway.app";
const TOKEN_STORAGE_KEY = "pocketstampMerchantAccessToken";

const demoHref =
  "mailto:hello@getpocketstamp.com?subject=PocketStamp demo enquiry";
const pilotHref =
  "mailto:hello@getpocketstamp.com?subject=PocketStamp café pilot";
const demoJoinUrl = "/join/pocket-stamp-demo";
const demoSuccessUrl = "/join/pocket-stamp-demo/success";
const demoJoinAbsoluteUrl = "https://getpocketstamp.com/join/pocket-stamp-demo";
const demoCreateCardUrl = "/demo/pocket-stamp-demo/create";
const demoPassStorageKey = "pocketstampDemoPassUrl";

const steps = [
  ["Scan QR", "Customer scans your café’s join QR.", "QR"],
  ["Add to Wallet", "They create a branded loyalty card in Apple Wallet.", "Wallet"],
  ["Tap at the counter", "They tap their phone or watch on a compatible reader.", "Tap"],
  [
    "Track and remind",
    "You see activity, and PocketStamp can trigger simple Wallet reminders at key milestones.",
    "Data",
  ],
];

const walletBullets = [
  "Branded with your logo and colours",
  "No customer app required",
  "Always on their phone",
  "Updates automatically",
  "Replaces the paper stamp card",
];

const dashboardBullets = [
  "Live activity",
  "Customer list",
  "Reward redemptions",
  "Join QR and URL",
  "Reader status",
  "Wallet reminder activity",
];

const reminderBullets = [
  ["Halfway reminders", "You’re halfway to your free coffee."],
  ["Almost-there reminders", "Only one coffee away from your free one."],
  ["Reward-ready messages", "Your free coffee is ready."],
  ["Birthday rewards", "Happy Birthday! Enjoy a free coffee on us today."],
];

const setupSteps = [
  "Send your logo, colours and reward",
  "We build your Wallet card and join page",
  "You get your dashboard, QR code and reader setup",
  "Customers start joining",
];

const cafeFeatures = [
  ["Wallet card", "The stamp card your customers actually keep."],
  ["Join QR", "Customers scan. Wallet opens. Loyalty starts."],
  ["Merchant dashboard", "See joins, stamps, rewards and reader status in one calm view."],
  ["Customer list", "A customer list paper cards never gave you."],
  ["Reminders", "Automatic nudges, straight from Apple Wallet."],
];

const proofPanels = [
  ["Customer list", "Names, emails, stamp progress and reward status."],
  ["Join flow", "QR code to a branded Apple Wallet loyalty card without a downloaded app."],
  ["Wallet reminders", "Halfway, almost there, reward-ready and birthday messages."],
];

async function requestJson(path, options = {}) {
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

function loginMerchant(email, password) {
  return requestJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

function fetchMerchantSetupInvite(token) {
  const params = new URLSearchParams({ token });
  return requestJson(`/api/merchant/setup?${params.toString()}`);
}

function activateMerchantSetup({ token, name, password, confirmPassword }) {
  return requestJson("/api/merchant/setup", {
    method: "POST",
    body: JSON.stringify({ token, name, password, confirmPassword }),
  });
}

function fetchMerchantMe(accessToken) {
  return requestJson("/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function fetchMerchantActivity(accessToken) {
  return requestJson("/api/merchant/activity?limit=10", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function fetchMerchantCustomers(accessToken, { search = "", status = "all", limit = 50 } = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    status,
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  return requestJson(`/api/merchant/customers?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function fetchMerchantReminderSummary(accessToken) {
  return requestJson("/api/merchant/reminders/summary", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function fetchMerchantDashboardSummary(accessToken) {
  return requestJson("/api/merchant/dashboard/summary", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function fetchScannerDevice(deviceToken) {
  const requestUrl = `${API_BASE_URL}/api/merchant/scanner/device?deviceToken=${encodeURIComponent(deviceToken)}`;
  const response = await fetch(requestUrl, {
    method: "GET",
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (parseError) {
    parseError.status = response.status;
    parseError.responseText = text;
    parseError.requestUrl = requestUrl;
    throw parseError;
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      "Could not connect to this scanner device.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    error.responseText = text;
    error.requestUrl = requestUrl;
    throw error;
  }

  return payload;
}

function submitScannerScan({ deviceToken, scanValue }) {
  return requestJson("/api/merchant/scanner/scan", {
    method: "POST",
    body: JSON.stringify({ deviceToken, scanValue }),
  });
}

function redeemScannerReward({ deviceToken, scanResult }) {
  return requestJson("/api/merchant/scanner/redeem", {
    method: "POST",
    body: JSON.stringify(buildScannerActionBody(deviceToken, scanResult)),
  });
}

function undoScannerStamp({ deviceToken, scanResult }) {
  return requestJson("/api/merchant/scanner/undo", {
    method: "POST",
    body: JSON.stringify(buildScannerActionBody(deviceToken, scanResult)),
  });
}

function toTitle(value) {
  if (!value) return "Activity";
  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeSlug(value) {
  return String(value || "merchant")
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

function buildScannerActionBody(deviceToken, scanResult = {}) {
  const scan = scanResult || {};
  const eventId = pickFirst(
    scan.eventId,
    scan.scanEventId,
    scan.stampEventId,
    scan.activityId,
    scan.result?.eventId,
    scan.event?.id,
  );
  const customerId = pickFirst(
    scan.customerId,
    scan.passCustomerId,
    scan.customer?.id,
    scan.result?.customerId,
  );

  return {
    deviceToken,
    ...(eventId ? { eventId, scanEventId: eventId } : {}),
    ...(customerId ? { customerId } : {}),
  };
}

function normalizeMerchantContext(payload) {
  const source =
    payload?.merchantContext ||
    payload?.context ||
    payload?.merchant ||
    payload?.user?.merchant ||
    payload?.data?.merchantContext ||
    payload?.data?.merchant ||
    payload ||
    {};

  const user = payload?.user || payload?.data?.user || source?.user || {};
  const location =
    source?.location ||
    source?.merchantLocation ||
    source?.locations?.[0] ||
    payload?.location ||
    {};

  const merchantName = pickFirst(
    source.merchantName,
    source.name,
    source.displayName,
    source.businessName,
    payload?.merchantName,
    "PocketStamp merchant",
  );

  return {
    raw: payload,
    merchantId: pickFirst(source.merchantId, source.id, source._id, payload?.merchantId),
    merchantName,
    merchantSlug: pickFirst(source.merchantSlug, source.slug, payload?.merchantSlug),
    locationName: pickFirst(
      source.locationName,
      location.name,
      location.displayName,
      payload?.locationName,
      "Primary location",
    ),
    role: pickFirst(source.role, user.role, payload?.role, "Merchant"),
    email: pickFirst(user.email, source.email, payload?.email),
    totalCustomers: pickFirst(source.totalCustomers, source.customerCount),
  };
}

function extractAccessToken(payload) {
  return pickFirst(
    payload?.session?.accessToken,
    payload?.accessToken,
    payload?.token,
    payload?.jwt,
    payload?.data?.session?.accessToken,
    payload?.data?.accessToken,
    payload?.data?.token,
  );
}

function extractActivityRows(payload) {
  const candidates = [
    payload,
    payload?.activity,
    payload?.activities,
    payload?.events,
    payload?.items,
    payload?.data,
    payload?.data?.activity,
    payload?.data?.activities,
    payload?.data?.events,
    payload?.data?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function extractCustomerRows(payload) {
  const candidates = [
    payload,
    payload?.customers,
    payload?.items,
    payload?.data,
    payload?.data?.customers,
    payload?.data?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function getActivityTimestamp(item) {
  return pickFirst(
    item.timestamp,
    item.createdAt,
    item.created_at,
    item.scannedAt,
    item.updatedAt,
    item.date,
  );
}

function getActivityType(item) {
  return pickFirst(item.type, item.eventType, item.action, item.event, item.kind);
}

function getActivityText(item) {
  return [
    item.type,
    item.eventType,
    item.action,
    item.event,
    item.kind,
    item.result,
    item.status,
    item.rewardType,
    item.reward_type,
    item.rewardName,
    item.reward_name,
    item.title,
    item.description,
    item.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getActivityCustomerName(item) {
  return pickFirst(
    item.customerName,
    item.customer_name,
    item.name,
    item.customer?.name,
    item.customer?.fullName,
    item.customer?.firstName && item.customer?.lastName
      ? `${item.customer.firstName} ${item.customer.lastName}`
      : null,
    item.customer?.firstName,
    item.email,
  );
}

function looksLikeStamp(item) {
  const haystack = getActivityText(item);
  return haystack.includes("stamp") || haystack.includes("+1");
}

function looksLikeReward(item) {
  const haystack = getActivityText(item);
  return haystack.includes("reward") || haystack.includes("redeem");
}

function looksLikeBirthdayReward(item) {
  const haystack = getActivityText(item);
  return looksLikeReward(item) && haystack.includes("birthday");
}

function looksLikeJoin(item) {
  const haystack = getActivityText(item);
  return (
    haystack.includes("join") ||
    haystack.includes("signup") ||
    haystack.includes("sign up") ||
    haystack.includes("customer_created") ||
    haystack.includes("customer created")
  );
}

function looksLikeWalletPass(item) {
  const haystack = getActivityText(item);
  return haystack.includes("pass") || haystack.includes("wallet");
}

function looksLikeReminder(item) {
  const haystack = getActivityText(item);
  return haystack.includes("reminder") || haystack.includes("notification");
}

function formatActivityTime(timestamp, { sentence = false } = {}) {
  if (!timestamp) return "Recent";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Recent";

  if (sentence) {
    const datePart = new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
    const timePart = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    return `${datePart} at ${timePart}`;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatActivityTitle(item) {
  const haystack = getActivityText(item);
  const backendTitle = pickFirst(item.title, item.description, item.message);

  if (looksLikeBirthdayReward(item) && haystack.includes("activat")) {
    return "Birthday reward activated";
  }

  if (looksLikeBirthdayReward(item)) return "Birthday reward redeemed";

  if (looksLikeReward(item) && haystack.includes("redeem")) {
    return "Reward redeemed";
  }

  if (looksLikeStamp(item)) return "Stamp added";
  if (looksLikeReward(item)) return "Reward earned";
  if (looksLikeReminder(item) && haystack.includes("sent")) return "Reminder sent";
  if (looksLikeReminder(item)) return "Wallet reminder";
  if (looksLikeJoin(item)) return "Customer joined";
  if (looksLikeWalletPass(item) && haystack.includes("creat")) {
    return "Apple Wallet card created";
  }
  if (looksLikeWalletPass(item)) return "Apple Wallet card updated";

  return pickFirst(
    backendTitle && backendTitle.length > 8 ? backendTitle : null,
    toTitle(getActivityType(item)),
  );
}

function formatCustomerDate(timestamp) {
  if (!timestamp) return "Not recorded";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function formatCustomerShortDate(timestamp) {
  if (!timestamp) return "No activity yet";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatCustomerBirthday(customer) {
  const month = Number(customer.birthdayMonth);
  const day = Number(customer.birthdayDay);

  if (!month || !day) return "Not saved";

  const date = new Date(2024, month - 1, day);
  if (Number.isNaN(date.getTime())) return "Not saved";

  const formattedMonth = new Intl.DateTimeFormat(undefined, {
    month: "short",
  }).format(date);

  return `${formattedMonth} ${day}`;
}

function getCustomerName(customer) {
  return pickFirst(customer.name, customer.fullName, customer.firstName, "Wallet customer");
}

function getCustomerId(customer, index) {
  return pickFirst(customer.id, customer.passSerialNumber, customer.email, `customer-${index}`);
}

function getCustomerStampProgress(customer) {
  const currentStamps = Number(customer.currentStamps ?? 0);
  const rewardThreshold = Number(customer.rewardThreshold ?? 10);

  return `${Number.isFinite(currentStamps) ? currentStamps : 0}/${
    Number.isFinite(rewardThreshold) && rewardThreshold > 0 ? rewardThreshold : 10
  }`;
}

function getCustomerStatus(customer) {
  const statusText = [
    customer.rewardStatus,
    customer.status,
    customer.walletPassStatus,
    customer.birthdayActive ? "birthday_active" : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const currentStamps = Number(customer.currentStamps ?? 0);
  const rewardThreshold = Number(customer.rewardThreshold ?? 10);
  const hasBirthday = Boolean(customer.birthdayMonth && customer.birthdayDay);

  if (statusText.includes("birthday_active")) return "Birthday reward active";
  if (statusText.includes("reward_ready") || statusText.includes("ready")) {
    return "Reward ready";
  }
  if (statusText.includes("almost_there") || statusText.includes("almost")) {
    return "Almost there";
  }
  if (hasBirthday && statusText.includes("birthday")) return "Birthday saved";
  if (
    Number.isFinite(currentStamps) &&
    Number.isFinite(rewardThreshold) &&
    rewardThreshold > 0
  ) {
    if (currentStamps >= rewardThreshold) return "Reward ready";
    if (rewardThreshold - currentStamps <= 2) return "Almost there";
  }
  if (hasBirthday) return "Birthday saved";
  return "Active";
}

function getCustomerStatusClass(status) {
  if (status === "Reward ready" || status === "Birthday reward active") {
    return "bg-[#e7f7f3] text-[#16856f]";
  }
  if (status === "Almost there") return "bg-amber-50 text-amber-800";
  if (status === "Birthday saved") return "bg-violet-50 text-violet-700";
  return "bg-slate-100 text-slate-600";
}

function formatCustomerWalletStatus(customer) {
  return toTitle(pickFirst(customer.walletPassStatus, customer.passStatus, "Active"));
}

function formatCustomerCardId(customer) {
  const cardId = pickFirst(customer.passSerialNumber, customer.passId, customer.cardId);
  if (!cardId) return "Not recorded";

  const text = String(cardId);
  return text.length > 18 ? `${text.slice(0, 8)}...${text.slice(-6)}` : text;
}

function formatActivityMeta(item) {
  return pickFirst(
    getActivityCustomerName(item),
    item.readerName,
    item.locationName,
    item.passSerialNumber,
    item.passId,
    item.readerId,
  );
}

function formatActivitySource(item) {
  const directSource = pickFirst(
    item.source,
    item.channel,
    item.origin,
    item.entryMethod,
    item.createdBy,
    item.deviceType,
    item.device?.type,
  );
  const sourceText = [
    directSource,
    item.scannerDeviceName,
    item.scannerDeviceId,
    item.readerName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (sourceText.includes("scanner") || sourceText.includes("scan")) return "Via counter scanner";
  if (sourceText.includes("dashboard")) return "Via dashboard";
  if (sourceText.includes("manual") || sourceText.includes("staff")) return "Manual";
  if (directSource) return `Via ${toTitle(directSource).toLowerCase()}`;
  return "";
}

function getActivityStampProgress(item) {
  const current = pickFirst(
    item.currentStamps,
    item.stamps,
    item.stampCount,
    item.current_stamps,
    item.customer?.currentStamps,
    item.result?.currentStamps,
    item.result?.stamps,
  );
  const threshold = pickFirst(
    item.rewardThreshold,
    item.threshold,
    item.reward_threshold,
    item.customer?.rewardThreshold,
    item.result?.rewardThreshold,
    item.result?.threshold,
  );
  const currentNumber = Number(current);
  const thresholdNumber = Number(threshold);

  if (Number.isFinite(currentNumber) && Number.isFinite(thresholdNumber) && thresholdNumber > 0) {
    return `${currentNumber}/${thresholdNumber} stamps`;
  }
  if (Number.isFinite(currentNumber)) return `${currentNumber} stamps`;
  return "";
}

function formatActivityDetailParts(item) {
  const customerName = getActivityCustomerName(item);
  const source = formatActivitySource(item);
  const parts = [];

  if (customerName) parts.push(customerName);

  if (looksLikeStamp(item)) {
    if (!customerName) parts.push("Customer");
    parts.push(pickFirst(getActivityStampProgress(item), "Stamp"));
  } else if (looksLikeReward(item)) {
    if (!customerName) parts.push("Customer");
    parts.push("Reward claimed");
  } else if (looksLikeJoin(item)) {
    if (!customerName) parts.push("Customer");
    parts.push("Added Apple Wallet pass");
  } else if (looksLikeReminder(item)) {
    parts.push("Wallet reminder");
  }

  if (source) parts.push(source);

  return parts.length ? parts : [customerName || toTitle(getActivityType(item)) || "Activity"];
}

function formatActivityDetail(item) {
  return formatActivityDetailParts(item).filter(Boolean).join(" · ");
}

function formatActivityBadge(item) {
  if (looksLikeBirthdayReward(item)) return "Birthday";
  if (looksLikeStamp(item)) return "Stamp";
  if (looksLikeReward(item)) return "Redeemed";
  if (looksLikeReminder(item)) return "Reminder";
  if (looksLikeJoin(item)) return "Joined";
  if (looksLikeWalletPass(item)) return "Wallet";
  return toTitle(getActivityType(item));
}

function formatScannerMode(value) {
  const mode = String(value || "").toLowerCase();
  if (mode.includes("confirm")) return "Confirm stamp";
  if (mode.includes("auto")) return "Auto-stamp";
  return value ? toTitle(value) : "Auto-stamp";
}

function formatScannerBoolean(value) {
  if (value === undefined || value === null || value === "") return null;
  return value ? "On" : "Off";
}

function formatScannerCooldown(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return `${seconds}s`;
}

function getScannerDashboardData(summary = {}) {
  const candidates = [
    summary?.scanner,
    summary?.scannerMode,
    summary?.scannerStatus,
    summary?.scannerDevice,
    summary?.device,
    summary?.devices?.[0],
    summary?.scannerDevices?.[0],
    summary?.counterScanner,
  ].filter(Boolean);
  const scanner = candidates[0] || null;
  const deviceList = [summary?.scannerDevices, summary?.devices, scanner?.devices].find(Array.isArray);
  const device = deviceList?.[0] || scanner;
  const scannerUrl = pickFirst(
    scanner?.scannerUrl,
    scanner?.scannerURL,
    scanner?.kioskUrl,
    scanner?.kioskURL,
    scanner?.url,
    device?.scannerUrl,
    device?.kioskUrl,
  );
  const hasExplicitReady = [
    summary?.hasScannerDevices,
    summary?.scannerDevicesCount > 0,
    scanner?.ready,
    scanner?.isReady,
    scanner?.enabled,
    scanner?.isEnabled,
    scanner?.configured,
    scanner?.isConfigured,
    device?.ready,
    device?.enabled,
  ].some(Boolean);
  const hasExplicitNotReady = [
    summary?.hasScannerDevices === false,
    scanner?.ready === false,
    scanner?.isReady === false,
    scanner?.enabled === false,
    scanner?.isEnabled === false,
    scanner?.configured === false,
    scanner?.isConfigured === false,
  ].some(Boolean);
  const hasScannerData = Boolean(scanner || deviceList || scannerUrl);
  const isReady = hasExplicitReady || Boolean(scannerUrl) || (hasScannerData && !hasExplicitNotReady);
  const rawMode = pickFirst(device?.mode, device?.scannerMode, scanner?.mode, scanner?.scannerMode);

  return {
    hasScannerData,
    isReady,
    isFallback: !hasScannerData,
    scannerUrl,
    deviceName: pickFirst(device?.deviceName, device?.name, device?.label, scanner?.deviceName),
    mode: rawMode ? formatScannerMode(rawMode) : null,
    cooldown: formatScannerCooldown(
      pickFirst(
        device?.cooldownSeconds,
        device?.stampCooldownSeconds,
        scanner?.cooldownSeconds,
        scanner?.stampCooldownSeconds,
      ),
    ),
    rewardConfirmation: formatScannerBoolean(
      pickFirst(
        device?.rewardConfirmationRequired,
        device?.requiresRewardConfirmation,
        scanner?.rewardConfirmationRequired,
        scanner?.requiresRewardConfirmation,
      ),
    ),
    lastScan: formatActivityTime(
      pickFirst(device?.lastScanAt, scanner?.lastScanAt, scanner?.lastScan?.createdAt),
    ),
  };
}

function customerWasScannedToday(customer) {
  if (customer.scannedToday || customer.hasScannedToday) return true;
  const timestamp = pickFirst(customer.lastScannedAt, customer.lastScanAt, customer.lastScannerScanAt);
  if (!timestamp) return false;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function formatReminderDate(timestamp) {
  if (!timestamp) return "None yet.";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "None yet.";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function IconMark({ label, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl text-xs font-bold ${className}`}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

function CheckMark({ className = "" }) {
  return (
    <span
      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-xs font-bold text-[#2f6df6] ${className}`}
      aria-hidden="true"
    >
      ✓
    </span>
  );
}

function LoadingText({ label = "Loading..." }) {
  return <span>{label}</span>;
}

function WalletPassMockup({ hero = false }) {
  return (
    <div className={`mx-auto w-full ${hero ? "max-w-lg" : "max-w-sm"}`}>
      <div className="rounded-[34px] bg-[#24201c] p-3 shadow-2xl shadow-stone-900/10">
        <div className="rounded-[28px] bg-[#fffdf8] p-3">
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
            <div className="bg-[#26354f] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <IconMark label="PS" className="h-12 w-12 bg-white text-[#26354f]" />
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-[#9ec5ff]" />
                  Apple Wallet
                </div>
              </div>

              <p className="mt-8 text-sm font-semibold uppercase text-white/65">
                Harbour House Café
              </p>
              <p className="mt-3 text-xs font-semibold uppercase text-white/55">
                Stamps
              </p>
              <p className="mt-1 text-5xl font-semibold">0/10</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-full border border-slate-300 bg-slate-50"
                  />
                ))}
              </div>

              <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-stone-400">
                    Reward
                  </p>
                  <p className="mt-1 font-semibold text-[#26211d]">
                    10th coffee free
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-2 rounded-sm ${
                        index % 3 === 0 ? "bg-slate-950" : "bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReminderMockup() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="overflow-hidden rounded-3xl bg-[#fffdf8] p-3 shadow-2xl shadow-stone-900/10 ring-1 ring-stone-200">
        <img
          src="/pocketstamp-notifications-phone.png"
          alt="iPhone lock screen showing PocketStamp Wallet reminder notifications"
          className="block w-full rounded-[22px]"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="mt-5 rounded-2xl bg-[#fffdf8] p-5 shadow-xl shadow-stone-900/10 ring-1 ring-stone-200">
        <p className="text-lg font-semibold text-[#26211d]">
          Automated Apple Wallet reminders
        </p>
        <p className="mt-2 leading-7 text-stone-600">
          PocketStamp can remind customers when they’re close to a reward, have
          earned one, have a birthday reward, or haven’t visited in a while.
        </p>
      </div>
    </div>
  );
}

function DashboardMockup() {
  const rows = [
    ["10:42", "Maya joined", "QR"],
    ["10:49", "Alex collected a stamp", "+1"],
    ["11:03", "Priya redeemed reward", "Reward"],
  ];

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-3xl bg-[#fffdf8] p-5 shadow-2xl shadow-stone-900/10 ring-1 ring-stone-200">
        <div className="flex items-center justify-between border-b border-stone-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase text-stone-400">
              PocketStamp dashboard
            </p>
            <p className="mt-1 text-lg font-semibold text-[#26211d]">
              Today at Harbour House
            </p>
          </div>
          <div className="rounded-xl bg-[#e8f0ff] p-3 text-[#2f6df6]">
            <span className="text-xs font-bold">Live</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["126", "customers"],
            ["48", "stamps"],
            ["9", "rewards"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-[#f7f3ec] p-4">
              <p className="text-2xl font-semibold text-[#26211d]">{value}</p>
              <p className="mt-1 text-sm text-stone-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          {rows.map(([time, event, tag]) => (
            <div
              key={`${time}-${event}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f3ec] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#26211d]">{event}</p>
                <p className="mt-0.5 text-xs text-stone-500">{time}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
                {tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimpleBullets({ items }) {
  return (
    <ul className="mt-7 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-3 text-slate-700">
          <CheckMark className="mt-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FeatureBullets({ items }) {
  return (
    <ul className="mt-8 space-y-5">
      {items.map(([title, body]) => (
        <li key={title} className="flex gap-4">
          <CheckMark className="mt-1" />
          <div>
            <p className="font-semibold text-slate-950">{title}</p>
            <p className="mt-1 leading-7 text-slate-600">{body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DemoWalletPreview() {
  return (
    <div className="ps-demo-pass">
      <div className="ps-demo-pass-top">
        <div>
          <p className="ps-demo-pass-brand">PocketStamp</p>
          <p className="ps-demo-pass-subtitle">Apple Wallet loyalty card</p>
        </div>
        <span>Demo</span>
      </div>

      <div className="ps-demo-pass-stamps">
        <p>Stamps</p>
        <strong>0/10</strong>
      </div>

      <div className="ps-demo-stamp-grid" aria-label="Ten empty demo stamp circles">
        {Array.from({ length: 10 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>

      <div className="ps-demo-pass-bottom">
        <div>
          <p>Reward</p>
          <strong>10th coffee free</strong>
        </div>
        <div className="ps-demo-marker" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className={index % 3 === 0 ? "is-dark" : ""} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoJoinPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const params = new URLSearchParams();

    if (fullName.trim()) params.set("name", fullName.trim());
    if (email.trim()) params.set("email", email.trim());
    params.set("birthdayMonth", "");
    params.set("birthdayDay", "");

    try {
      const response = await fetch(demoCreateCardUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const payload = await response.json();
      const passUrl = payload?.passUrl || "";

      if (!response.ok || !passUrl) {
        throw new Error(
          payload?.error ||
            "Demo card was created, but no Wallet pass URL was returned.",
        );
      }

      sessionStorage.setItem(demoPassStorageKey, passUrl);

      const successParams = new URLSearchParams({
        passUrl,
      });

      if (payload?.successUrl) successParams.set("successUrl", payload.successUrl);

      if (fullName.trim()) successParams.set("name", fullName.trim());

      window.location.href = `${demoSuccessUrl}?${successParams.toString()}`;
    } catch (submitError) {
      setError(
        submitError.message ||
          "Unable to create the demo Wallet card right now. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ps-flow min-h-screen px-5 py-8 text-[var(--ps-espresso)] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="ps-flow-card">
          <a href="/" className="ps-flow-brand" aria-label="PocketStamp home">
            <span>POCKETSTAMP</span>
            <small>Apple Wallet loyalty for cafés</small>
          </a>

          <div className="mt-10">
            <p className="ps-eyebrow">Demo Wallet card</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-[var(--ps-espresso)] sm:text-5xl">
              Try a PocketStamp demo card
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--ps-muted)]">
              Create a sample loyalty card and add it to Apple Wallet on your
              iPhone.
            </p>
            <p className="mt-3 leading-7 text-[var(--ps-muted)]">
              PocketStamp helps cafés replace paper stamp cards with a branded
              Apple Wallet loyalty card, customer list, and automatic reminders.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-[var(--ps-espresso)]">
                Full name
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
                className="ps-input mt-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[var(--ps-espresso)]">
                Email address
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="ps-input mt-2"
              />
            </label>

            {error ? (
              <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={isSubmitting} className="ps-button-primary w-full">
              {isSubmitting ? "Creating demo card..." : "Create Demo Wallet Card"}
            </button>
          </form>

          <p className="mt-5 text-sm leading-6 text-[var(--ps-muted)]">
            Best opened on iPhone. After signup, your demo card will open in
            Apple Wallet. This is a sample PocketStamp card. No purchase
            required.
          </p>
        </section>

        <section className="relative">
          <div className="ps-flow-glow" aria-hidden="true" />
          <DemoWalletPreview />
        </section>
      </div>
    </main>
  );
}

function DemoSuccessPage() {
  const params = new URLSearchParams(window.location.search);
  const customerName = params.get("name")?.trim();
  const passUrl = params.get("passUrl") || sessionStorage.getItem(demoPassStorageKey) || "";
  const hasPassUrl = Boolean(passUrl);

  return (
    <main className="ps-flow min-h-screen px-5 py-8 text-[var(--ps-espresso)] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="ps-flow-card">
          <a href="/" className="ps-flow-brand" aria-label="PocketStamp home">
            <span>POCKETSTAMP</span>
            <small>Apple Wallet loyalty for cafés</small>
          </a>

          <div className="mt-10">
            <p className="ps-eyebrow">Demo card ready</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-[var(--ps-espresso)] sm:text-5xl">
              {hasPassUrl
                ? "Your PocketStamp demo card is ready."
                : "Create your PocketStamp demo card."}
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--ps-muted)]">
              {hasPassUrl
                ? `${customerName ? `${customerName}, tap below` : "Tap below"} to open Apple Wallet and add your card.`
                : "This success page needs a fresh demo Wallet card link. Head back to create a sample card first."}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {hasPassUrl ? (
              <a
                href={passUrl}
                className="ps-button-primary"
              >
                Add Demo Card to Apple Wallet
              </a>
            ) : null}
            <a href={demoJoinUrl} className="ps-button-secondary">
              {hasPassUrl ? "Edit details" : "Create a demo card"}
            </a>
          </div>

          <p className="mt-5 text-sm leading-6 text-[var(--ps-muted)]">
            {hasPassUrl
              ? "Safari may briefly open the pass file before Apple Wallet appears. After adding the card, you can return to this page."
              : "This is a sample PocketStamp card. It updates like a real café loyalty card."}
          </p>
        </section>

        <section className="relative">
          <div className="ps-flow-glow" aria-hidden="true" />
          <DemoWalletPreview />
        </section>
      </div>
    </main>
  );
}

function MerchantSetupPage() {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);
  const [invite, setInvite] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInvite() {
      if (!token) {
        setError("This setup link is missing a token.");
        setIsLoading(false);
        return;
      }

      try {
        const payload = await fetchMerchantSetupInvite(token);
        const nextInvite = payload?.invite || null;
        if (!isMounted) return;
        setInvite(nextInvite);
        setName(nextInvite?.name || "");
      } catch (inviteError) {
        if (isMounted) setError(inviteError.message || "Unable to load setup link.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInvite();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await activateMerchantSetup({
        token,
        name,
        password,
        confirmPassword,
      });
      const accessToken = extractAccessToken(payload);
      if (!accessToken) {
        throw new Error("Setup completed, but no session token was returned.");
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      window.location.href = "/merchant";
    } catch (setupError) {
      setError(setupError.message || "Unable to complete merchant setup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-6 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200">
          <a href="/" className="flex items-center gap-3" aria-label="PocketStamp home">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#143d3b] text-white">
              PS
            </span>
            <span className="text-xl font-semibold">PocketStamp Merchant</span>
          </a>

          <div className="mt-10">
            <h1 className="text-3xl font-semibold text-slate-950">Set up your merchant account</h1>
            <p className="mt-3 leading-7 text-slate-600">
              {invite
                ? `Create a password for ${invite.merchantName || "your café"} and open your dashboard.`
                : "Create your merchant dashboard login."}
            </p>
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-2xl bg-[#f8fafc] p-4 text-sm font-semibold text-slate-600">
              Checking setup link...
            </div>
          ) : error && !invite ? (
            <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  value={invite?.email || ""}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10"
                />
              </label>

              {error ? (
                <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#143d3b] px-5 py-3 font-semibold text-white transition hover:bg-[#0f2f2d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Setting up..." : "Create account"}
              </button>

              <p className="text-sm leading-6 text-slate-500">
                Already set up? <a href="/merchant" className="font-semibold text-[#16856f]">Sign in</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function MerchantLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload = await loginMerchant(email, password);
      const accessToken = extractAccessToken(payload);

      if (!accessToken) {
        throw new Error(
          "Login succeeded, but the response did not include session.accessToken. Safe debug: expected a session object with an accessToken field.",
        );
      }

      // TODO: Future: switch to more robust session handling if needed.
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      onLogin(accessToken, normalizeMerchantContext(payload));
    } catch (loginError) {
      setError(loginError.message || "Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-6 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200">
          <a href="/" className="flex items-center gap-3" aria-label="PocketStamp home">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#143d3b] text-white">
              PS
            </span>
            <span className="text-xl font-semibold">PocketStamp Merchant</span>
          </a>

          <div className="mt-10">
            <h1 className="text-3xl font-semibold text-slate-950">
              Sign in to view your loyalty dashboard
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
              Manage Wallet loyalty activity, join links and reader setup from
              one clean merchant view.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10"
              />
            </label>

            {error ? (
              <div className="flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
                  !
                </span>
                <p>{error}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#143d3b] px-5 py-3 font-semibold text-white transition hover:bg-[#0f302f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <LoadingText label="" /> : null}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function OverviewCard({ label, value, helper, iconLabel }) {
  return (
    <div className="ps-dashboard-card rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--ps-muted)]">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--ps-espresso)]">{value}</p>
          {helper ? <p className="mt-2 text-sm text-[var(--ps-muted)]">{helper}</p> : null}
        </div>
        <div className="rounded-xl bg-[var(--ps-blue-soft)] p-3 text-[var(--ps-blue)]">
          <span className="text-xs font-bold">{iconLabel}</span>
        </div>
      </div>
    </div>
  );
}

function PaginationControls({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-slate-500">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function CounterScannerSection({ scanner }) {
  const detailRows = [
    ["Device", scanner.deviceName],
    ["Mode", scanner.mode],
    ["Cooldown", scanner.cooldown],
    ["Reward confirmation", scanner.rewardConfirmation],
    ["Last scan", scanner.lastScan],
  ].filter(([, value]) => Boolean(value));

  const statusLabel = scanner.isFallback ? "Available" : scanner.isReady ? "Ready" : "Not set up";

  return (
    <section className="ps-dashboard-card rounded-2xl p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-[var(--ps-espresso)]">
              Counter Scanner Mode
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                scanner.isReady || scanner.isFallback
                  ? "bg-[#e7f7f3] text-[#16856f]"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-3 max-w-3xl leading-7 text-[var(--ps-muted)]">
            {scanner.isFallback
              ? "Counter scanner setup is managed by PocketStamp."
              : scanner.isReady
                ? "Customers can scan their Apple Wallet pass at the till and stamps are added automatically."
                : "PocketStamp can connect a counter scanner so customers scan at the till and stamps are added automatically."}
          </p>
        </div>

        {scanner.scannerUrl ? (
          <a
            href={scanner.scannerUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[var(--ps-blue)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#255ddd]"
          >
            Open scanner screen
          </a>
        ) : (
          <a
            href="mailto:hello@getpocketstamp.com?subject=PocketStamp Scanner Mode setup"
            className="inline-flex items-center justify-center rounded-full border border-[var(--ps-border)] bg-[var(--ps-card)] px-4 py-2.5 text-sm font-semibold text-[var(--ps-espresso)] transition hover:border-stone-300"
          >
            {scanner.isReady || scanner.isFallback
              ? "Scanner setup is handled by PocketStamp"
              : "Ask PocketStamp to set up Scanner Mode"}
          </a>
        )}
      </div>

      {detailRows.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {detailRows.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
              <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
              <p className="mt-2 truncate font-semibold text-slate-950" title={String(value)}>
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

const activityPageSize = 10;
const customerPageSize = 10;

function ActivityList({ activityRows, isLoading, error }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(activityRows.length / activityPageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * activityPageSize;
  const pagedActivityRows = activityRows.slice(pageStart, pageStart + activityPageSize);
  const activitySummary =
    activityRows.length > activityPageSize
      ? `Showing ${pageStart + 1}-${Math.min(pageStart + activityPageSize, activityRows.length)} of ${activityRows.length} activities`
      : `Showing latest ${activityRows.length} ${activityRows.length === 1 ? "activity" : "activities"}`;

  useEffect(() => {
    setPage(1);
  }, [activityRows]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white p-6 text-slate-600 ring-1 ring-slate-200">
        <LoadingText label="Loading recent activity..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex gap-3 rounded-2xl bg-white p-6 text-red-700 ring-1 ring-red-100">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
          !
        </span>
        <p>{error}</p>
      </div>
    );
  }

  if (!activityRows.length) {
    return (
      <div className="rounded-2xl bg-white p-6 text-slate-600 ring-1 ring-slate-200">
        No recent activity yet. New joins, stamps and rewards will appear here.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="mb-3 text-sm font-semibold text-slate-500">{activitySummary}</p>
      <div className="overflow-hidden rounded-xl ring-1 ring-slate-100">
        {pagedActivityRows.map((item, index) => (
          <div
            key={pickFirst(item.id, item._id, item.eventId, `${pageStart + index}-${getActivityTimestamp(item)}`)}
            className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-950">{formatActivityTitle(item)}</p>
              <p className="mt-1 truncate text-sm text-slate-600" title={formatActivityDetail(item)}>
                {formatActivityDetail(item)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formatActivityTime(getActivityTimestamp(item), { sentence: true })}
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#e7f7f3] px-3 py-1 text-sm font-semibold text-[#16856f]">
              {formatActivityBadge(item)}
            </span>
          </div>
        ))}
      </div>
      <PaginationControls page={safePage} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}

const baseCustomerFilters = [
  ["all", "All"],
  ["almost_there", "Almost there"],
  ["reward_ready", "Reward ready"],
  ["birthday_saved", "Birthday saved"],
];

function LoyaltyCustomersSection({
  customers,
  isLoading,
  error,
  search,
  onSearchChange,
  status,
  onStatusChange,
  expandedCustomerId,
  onExpandedCustomerChange,
}) {
  const [page, setPage] = useState(1);
  const supportsScannedToday = customers.some((customer) =>
    ["scannedToday", "hasScannedToday", "lastScannedAt", "lastScanAt", "lastScannerScanAt"].some(
      (field) => customer[field] !== undefined && customer[field] !== null,
    ),
  );
  const customerFilters = supportsScannedToday
    ? [...baseCustomerFilters, ["scanned_today", "Scanned today"]]
    : baseCustomerFilters;
  const visibleCustomers =
    status === "scanned_today" ? customers.filter(customerWasScannedToday) : customers;
  const pageCount = Math.max(1, Math.ceil(visibleCustomers.length / customerPageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * customerPageSize;
  const pagedCustomers = visibleCustomers.slice(pageStart, pageStart + customerPageSize);
  const customerSummary = isLoading
    ? "Loading customers"
    : visibleCustomers.length
      ? `Showing ${pageStart + 1}-${Math.min(pageStart + customerPageSize, visibleCustomers.length)} of ${visibleCustomers.length} customers`
      : "Showing 0 customers";

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">
            Loyalty Customers
          </h2>
          <p className="mt-1 max-w-2xl text-slate-500">
            Customers who have joined your Apple Wallet loyalty program.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {customerSummary}
          </p>
        </div>

        <label className="w-full lg:max-w-sm">
          <span className="sr-only">Search loyalty customers</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {customerFilters.map(([filterValue, label]) => {
          const isSelected = status === filterValue;

          return (
            <button
              key={filterValue}
              type="button"
              onClick={() => onStatusChange(filterValue)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                isSelected
                  ? "bg-[#143d3b] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-slate-100">
        {isLoading ? (
          <div className="flex items-center gap-3 p-5 text-slate-600">
            <LoadingText label="Loading loyalty customers..." />
          </div>
        ) : error ? (
          <div className="flex gap-3 p-5 text-red-700">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
              !
            </span>
            <p>{error}</p>
          </div>
        ) : !visibleCustomers.length ? (
          <div className="p-5 text-slate-600">
            {status === "scanned_today"
              ? "No scanned customers found for today."
              : "No loyalty customers yet. Customers will appear here when they create an Apple Wallet card."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pagedCustomers.map((customer, index) => {
              const customerId = getCustomerId(customer, pageStart + index);
              const customerStatus = getCustomerStatus(customer);
              const isExpanded = expandedCustomerId === customerId;
              const detailRows = [
                ["Joined", formatCustomerDate(customer.joinedDate)],
                ["Birthday", formatCustomerBirthday(customer)],
                ["Apple Wallet card", formatCustomerWalletStatus(customer)],
                ["Card ID", formatCustomerCardId(customer)],
                ["Reward threshold", `${Number(customer.rewardThreshold ?? 10) || 10} stamps`],
                ["Last activity", formatCustomerDate(customer.lastUpdated)],
              ];

              return (
                <div
                  key={customerId}
                  className="bg-white transition hover:bg-slate-50/70"
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      onExpandedCustomerChange(isExpanded ? null : customerId)
                    }
                    className="flex w-full flex-col gap-3 p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-[#16856f]/10 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-slate-950">
                        {getCustomerName(customer)}
                      </span>
                      <span className="mt-1 block truncate text-sm text-slate-500">
                        {customer.email || "No email saved"}
                      </span>
                    </span>

                    <span className="flex flex-wrap items-center gap-2 text-sm lg:justify-end">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getCustomerStatusClass(
                          customerStatus,
                        )}`}
                      >
                        {customerStatus}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                        {getCustomerStampProgress(customer)}
                      </span>
                      <span className="text-slate-500">
                        Last activity {formatCustomerShortDate(customer.lastUpdated)}
                      </span>
                      <span
                        className={`text-slate-400 transition ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      >
                        ˅
                      </span>
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-slate-100 bg-[#fbfaf7] px-4 py-4 sm:px-5">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {detailRows.map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <p className="text-xs font-semibold text-slate-400">
                              {label}
                            </p>
                            <p
                              className="mt-1 truncate text-sm font-semibold text-slate-700"
                              title={String(value)}
                            >
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <PaginationControls page={safePage} pageCount={pageCount} onPageChange={setPage} />
    </section>
  );
}

function DashboardQrCode({ value }) {
  return (
    <div className="mt-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100">
      <div className="mx-auto max-w-[220px] rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <QRCodeSVG
          value={value}
          size={196}
          level="M"
          includeMargin
          role="img"
          title={`QR code for ${value}`}
          className="block h-auto w-full"
          bgColor="#ffffff"
          fgColor="#020617"
        />
      </div>
    </div>
  );
}

function ReminderStatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ReminderStatusSection({ summary, isLoading, error }) {
  const reminderRows = [
    ["Halfway", "Active"],
    ["Almost there", "Active"],
    ["Reward ready", "Active"],
    ["Birthday rewards", "Active"],
    ["Win-back", "Active"],
  ];

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">
            Wallet reminders
          </h2>
          <p className="mt-1 max-w-2xl text-slate-600">
            Apple Wallet nudges for stamp progress, rewards and birthdays.
          </p>
        </div>
        <span className="w-fit rounded-full bg-[#e7f7f3] px-3 py-1 text-sm font-semibold text-[#16856f]">
          Active
        </span>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-xl bg-[#fbfaf7] p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
            Loading reminder stats...
          </div>
        ) : error ? (
          <div className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
            Reminder stats unavailable.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ReminderStatCard
              label="Sent this month"
              value={summary?.sentThisMonth ?? 0}
            />
            <ReminderStatCard
              label="Scheduled"
              value={summary?.scheduled ?? 0}
            />
            <ReminderStatCard
              label="Failed"
              value={summary?.failed ?? 0}
            />
            <ReminderStatCard
              label="Last reminder sent"
              value={formatReminderDate(summary?.lastSentAt)}
            />
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {reminderRows.map(([title, status]) => (
          <div key={title} className="rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-950">{title}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  status === "Active"
                    ? "bg-[#e7f7f3] text-[#16856f]"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MerchantDashboard({ accessToken, merchantContext, onLogout }) {
  const [activityRows, setActivityRows] = useState([]);
  const [activityError, setActivityError] = useState("");
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [dashboardSummaryError, setDashboardSummaryError] = useState("");
  const [isDashboardSummaryLoading, setIsDashboardSummaryLoading] = useState(true);
  const [reminderSummary, setReminderSummary] = useState(null);
  const [reminderError, setReminderError] = useState("");
  const [isReminderSummaryLoading, setIsReminderSummaryLoading] = useState(true);
  const [customerRows, setCustomerRows] = useState([]);
  const [customerError, setCustomerError] = useState("");
  const [isCustomersLoading, setIsCustomersLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStatus, setCustomerStatus] = useState("all");
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [copyState, setCopyState] = useState("idle");

  const merchantSlug = useMemo(
    () =>
      merchantContext.merchantSlug ||
      safeSlug(merchantContext.merchantName || merchantContext.merchantId),
    [merchantContext],
  );
  const joinUrl = `https://getpocketstamp.com/join/${merchantSlug}`;

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsActivityLoading(true);
      setActivityError("");
      setIsDashboardSummaryLoading(true);
      setDashboardSummaryError("");
      setIsReminderSummaryLoading(true);
      setReminderError("");

      const [activityResult, dashboardResult, reminderResult] = await Promise.allSettled([
        fetchMerchantActivity(accessToken),
        fetchMerchantDashboardSummary(accessToken),
        fetchMerchantReminderSummary(accessToken),
      ]);

      if (!isMounted) return;

      if (activityResult.status === "fulfilled") {
        setActivityRows(extractActivityRows(activityResult.value));
      } else {
        setActivityError(
          activityResult.reason?.message ||
            "Unable to load recent activity right now.",
        );
      }

      if (dashboardResult.status === "fulfilled") {
        setDashboardSummary(dashboardResult.value?.summary || null);
      } else {
        console.error("Dashboard summary fetch failed", {
          status: dashboardResult.reason?.status || "unknown",
          responseText:
            dashboardResult.reason?.responseText?.slice(0, 500) || "",
          message: dashboardResult.reason?.message || "Unknown error",
        });
        setDashboardSummaryError(
          dashboardResult.reason?.message ||
            "Unable to load dashboard totals right now.",
        );
      }

      if (reminderResult.status === "fulfilled") {
        setReminderSummary(reminderResult.value?.summary || null);
      } else {
        setReminderError(
          reminderResult.reason?.message ||
            "Unable to load reminder stats right now.",
        );
      }

      setIsActivityLoading(false);
      setIsDashboardSummaryLoading(false);
      setIsReminderSummaryLoading(false);
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      setIsCustomersLoading(true);
      setCustomerError("");

      try {
        const payload = await fetchMerchantCustomers(accessToken, {
          search: customerSearch,
          status: customerStatus === "scanned_today" ? "all" : customerStatus,
          limit: 50,
        });

        if (!isMounted) return;
        setCustomerRows(extractCustomerRows(payload));
      } catch (customerFetchError) {
        if (!isMounted) return;
        setCustomerError(
          customerFetchError.message ||
            "Unable to load loyalty customers right now.",
        );
      } finally {
        if (isMounted) {
          setIsCustomersLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [accessToken, customerSearch, customerStatus]);

  const metricFallback = dashboardSummaryError ? "Totals unavailable" : "—";
  const metricHelperFallback = dashboardSummaryError
    ? "Dashboard totals could not be loaded."
    : "Loading totals...";
  const scannerDashboard = getScannerDashboardData(dashboardSummary || {});

  async function handleCopyJoinUrl() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  function handleCustomerSearchChange(nextSearch) {
    setCustomerSearch(nextSearch);
    setExpandedCustomerId(null);
  }

  function handleCustomerStatusChange(nextStatus) {
    setCustomerStatus(nextStatus);
    setExpandedCustomerId(null);
  }

  return (
    <main className="ps-dashboard min-h-screen text-[var(--ps-espresso)]">
      <header className="border-b border-[var(--ps-border)] bg-[rgba(255,253,248,0.86)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-espresso)] text-white">
              PS
            </span>
            <div>
              <p className="text-sm font-semibold uppercase text-[var(--ps-blue)]">
                PocketStamp Merchant
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[var(--ps-espresso)]">
                {merchantContext.merchantName}
              </h1>
              <p className="mt-1 text-sm text-[var(--ps-muted)]">
                {merchantContext.locationName} · {merchantContext.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--ps-border)] bg-[var(--ps-card)] px-4 py-2.5 text-sm font-semibold text-[var(--ps-espresso)] transition hover:border-stone-300"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            label="Active Wallet cards"
            value={
              isDashboardSummaryLoading
                ? "..."
                : dashboardSummary?.activeWalletCards ?? metricFallback
            }
            helper={
              isDashboardSummaryLoading
                ? metricHelperFallback
                : dashboardSummaryError
                  ? metricHelperFallback
                  : `${dashboardSummary?.customersJoined ?? 0} customers joined`
            }
            iconLabel="Wallet"
          />
          <OverviewCard
            label="Stamps today"
            value={
              isDashboardSummaryLoading
                ? "..."
                : dashboardSummary?.stampsToday ?? metricFallback
            }
            helper={
              isDashboardSummaryLoading || dashboardSummaryError
                ? metricHelperFallback
                  : "stamps collected today"
            }
            iconLabel="Stamps"
          />
          <OverviewCard
            label="Rewards redeemed"
            value={
              isDashboardSummaryLoading
                ? "..."
                : dashboardSummary?.rewardsRedeemed ?? metricFallback
            }
            helper={
              isDashboardSummaryLoading || dashboardSummaryError
                ? metricHelperFallback
                  : "rewards claimed"
            }
            iconLabel="✓"
          />
          <OverviewCard
            label="Scanner Mode"
            value={
              isDashboardSummaryLoading
                ? "..."
                : scannerDashboard.isFallback
                  ? "Available"
                  : scannerDashboard.isReady
                    ? "Ready"
                    : "Not set up"
            }
            helper={
              isDashboardSummaryLoading
                ? metricHelperFallback
                : scannerDashboard.isFallback
                  ? "Counter scanner setup is managed by PocketStamp."
                  : scannerDashboard.isReady
                    ? "Customers can scan at the till."
                    : "Ask PocketStamp to connect your counter scanner."
            }
            iconLabel="Scan"
          />
        </div>

        <div className="mt-8">
          <CounterScannerSection scanner={scannerDashboard} />
        </div>

        <div className="mt-8">
          <LoyaltyCustomersSection
            customers={customerRows}
            isLoading={isCustomersLoading}
            error={customerError}
            search={customerSearch}
            onSearchChange={handleCustomerSearchChange}
            status={customerStatus}
            onStatusChange={handleCustomerStatusChange}
            expandedCustomerId={expandedCustomerId}
            onExpandedCustomerChange={setExpandedCustomerId}
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--ps-espresso)]">
                  Recent activity
                </h2>
                <p className="mt-1 text-[var(--ps-muted)]">
                  Latest joins, stamps and rewards from your loyalty activity.
                </p>
              </div>
            </div>
            <ActivityList
              activityRows={activityRows}
              isLoading={isActivityLoading}
              error={activityError}
            />
          </section>

          <aside className="space-y-6">
            <div className="ps-dashboard-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--ps-espresso)]">
                    Join QR
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--ps-muted)]">
                    Display this QR so new customers can add your Apple Wallet loyalty card.
                  </p>
                </div>
                <span className="text-sm font-bold text-[var(--ps-blue)]">QR</span>
              </div>

              <div className="mt-5 rounded-xl bg-[var(--ps-cream)] p-4 text-sm font-semibold leading-6 text-[var(--ps-espresso)] break-all">
                {joinUrl}
              </div>

              <DashboardQrCode value={joinUrl} />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCopyJoinUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ps-blue)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#255ddd]"
                >
                  {copyState === "copied"
                    ? "Copied"
                    : copyState === "failed"
                      ? "Copy failed"
                      : "Copy link"}
                </button>
                <a
                  href={joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--ps-border)] bg-[var(--ps-card)] px-4 py-2.5 text-sm font-semibold text-[var(--ps-espresso)] transition hover:border-stone-300"
                >
                  Open
                </a>
              </div>
            </div>

            <div className="ps-dashboard-card rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[var(--ps-blue-soft)] p-3 text-[var(--ps-blue)]">
                  <span className="text-xs font-bold">Tap</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--ps-espresso)]">
                    Scanner setup
                  </h2>
                  <p className="mt-3 font-semibold text-[var(--ps-espresso)]">
                    Counter Scanner Mode is live.
                  </p>
                  <p className="mt-2 leading-7 text-[var(--ps-muted)]">
                    NFC tap-to-stamp support can be added later when Apple approval
                    and compatible hardware are available.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8">
          <ReminderStatusSection
            summary={reminderSummary}
            isLoading={isReminderSummaryLoading}
            error={reminderError}
          />
        </div>
      </div>
    </main>
  );
}

function MerchantPortal() {
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [merchantContext, setMerchantContext] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(accessToken));

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!accessToken) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const payload = await fetchMerchantMe(accessToken);
        if (isMounted) {
          setMerchantContext(normalizeMerchantContext(payload));
        }
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (isMounted) {
          setAccessToken(null);
          setMerchantContext(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  async function handleLogin(token, initialContext) {
    setAccessToken(token);
    setMerchantContext(initialContext);

    try {
      const payload = await fetchMerchantMe(token);
      setMerchantContext(normalizeMerchantContext(payload));
    } catch {
      // Login context is enough for the MVP view; /me will refresh on next load.
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAccessToken(null);
    setMerchantContext(null);
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] text-slate-600">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
          <LoadingText label="Checking merchant session..." />
        </div>
      </main>
    );
  }

  if (!accessToken || !merchantContext) {
    return <MerchantLogin onLogin={handleLogin} />;
  }

  return (
    <MerchantDashboard
      accessToken={accessToken}
      merchantContext={merchantContext}
      onLogout={handleLogout}
    />
  );
}

function MarketingHomepage() {
  return (
    <main className="ps-site min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="ps-hero relative overflow-hidden">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-6 lg:px-8">
          <a href="/" className="ps-wordmark" aria-label="PocketStamp home">
            PocketStamp
          </a>
          <div className="flex items-center gap-4">
            <a href="#how-it-works" className="ps-nav-link hidden sm:inline-flex">
              How it works
            </a>
            <a href="/merchant" className="ps-nav-link hidden sm:inline-flex">
              Merchant
            </a>
            <a href={demoHref} className="ps-pill ps-pill-dark">
              Book a demo
            </a>
          </div>
        </nav>

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-6 md:pb-28 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="ps-eyebrow">Apple Wallet loyalty for independent cafés</p>
            <h1 className="ps-display mt-5 max-w-4xl text-[clamp(3.05rem,7vw,6.7rem)] leading-[0.94]">
              Paper stamp cards, rebuilt for Apple Wallet.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              PocketStamp gives cafés a branded Apple Wallet rewards card,
              customer list, and automatic reminders — without asking customers
              to download an app.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href={demoHref}
                className="ps-pill ps-pill-dark"
              >
                See demo
              </a>
              <a
                href={demoJoinUrl}
                className="ps-text-link"
              >
                Try a demo Wallet card
              </a>
            </div>
            <div className="ps-badges mt-10 flex flex-wrap gap-2.5">
              <span>No customer app</span>
              <span>Apple Wallet</span>
              <span>Built for independent cafés</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="ps-hero-visual"
          >
            <div className="ps-blue-glow" aria-hidden="true" />
            <WalletPassMockup hero />
            <div className="ps-join-card">
              <p className="text-xs font-bold uppercase text-slate-500">
                Demo Wallet card
              </p>
              <QRCodeSVG
                value={demoJoinAbsoluteUrl}
                size={82}
                aria-label="QR code for the PocketStamp demo Wallet card"
              />
              <p className="text-sm font-semibold text-slate-950">
                Scan to try the demo card
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="ps-manifesto">
        <p>No app. No paper. No forgotten stamp cards.</p>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="ps-eyebrow">What cafés get</p>
            <h2 className="ps-display mt-4 text-[clamp(2.4rem,5vw,4.8rem)] leading-[0.98]">
              The stamp card your customers actually keep.
            </h2>
          </div>
          <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
            {cafeFeatures.map(([title, body]) => (
              <div key={title} className="ps-feature-block">
                <p>{title}</p>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <p className="ps-eyebrow">How it works</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <h2 className="ps-display text-[clamp(2.4rem,5vw,5rem)] leading-[0.98]">
              Scan. Add to Wallet. Stamp. Bring them back.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-slate-700">
              A simple QR starts the flow. The card lives in Apple Wallet, the
              dashboard tracks activity, and reminders help customers remember
              the next coffee.
            </p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, body], index) => (
              <div key={title} className="ps-step">
                <span>0{index + 1}</span>
                <p>{title}</p>
                <small>{body}</small>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-6 text-slate-500">
            Designed around compatible Apple Wallet reader workflows, with QR
            scanning available now and reader setup ready for the next layer.
          </p>
        </div>
      </section>

      <section className="ps-glow-band py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
          <div>
            <p className="ps-eyebrow">Branded Wallet cards</p>
            <h2 className="ps-display mt-4 text-[clamp(2.5rem,5vw,5rem)] leading-[0.98]">
              Your café, inside your customer’s Wallet.
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-700">
              No loose paper. No app fatigue. Just a polished branded pass that
              updates automatically as stamps are collected.
            </p>
            <SimpleBullets items={walletBullets} />
          </div>
          <WalletPassMockup />
        </div>
      </section>

      <section className="bg-[#fbfaf7] py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <DashboardMockup />
          <div>
            <p className="ps-eyebrow">Dashboard and customer list</p>
            <h2 className="ps-display mt-4 text-[clamp(2.35rem,5vw,4.7rem)] leading-[0.98]">
              See what paper cards never showed you.
            </h2>
            <p className="mt-7 text-lg leading-8 text-slate-700">
              Your dashboard shows what happened today, who joined, which
              rewards were redeemed, and who is close to coming back.
            </p>
            <SimpleBullets items={dashboardBullets} />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
          <div>
            <p className="ps-eyebrow">Wallet reminders</p>
            <h2 className="ps-display mt-4 text-[clamp(2.35rem,5vw,4.8rem)] leading-[0.98]">
              Automatic reminders, straight from Apple Wallet.
            </h2>
            <p className="mt-7 text-lg leading-8 text-slate-700">
              PocketStamp can remind customers when they are halfway there,
              one coffee away, reward-ready, or due a birthday treat.
            </p>
            <FeatureBullets items={reminderBullets} />
          </div>
          <ReminderMockup />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="ps-eyebrow">Product proof</p>
            <h2 className="ps-display mt-4 text-[clamp(2.3rem,5vw,4.7rem)] leading-[0.98]">
              Built for real café workflows.
            </h2>
          </div>
          <div className="ps-proof-grid">
            {proofPanels.map(([title, body]) => (
              <div key={title}>
                <p>{title}</p>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-8">
          <div>
            <p className="ps-eyebrow">Early café offer</p>
            <h2 className="ps-display mt-4 text-[clamp(2.35rem,5vw,4.8rem)] leading-[0.98]">
              Setup in days. Ready this week.
            </h2>
            <p className="mt-7 text-lg leading-8 text-slate-700">
              Pilot spaces are open for independent cafés. We build the Wallet
              card, join QR, dashboard and reader setup around your café brand.
            </p>
          </div>
          <div className="ps-pricing">
            <p className="text-sm font-bold uppercase text-slate-500">Pilot package</p>
            <div className="mt-8 border-y border-slate-950/15 py-7">
              <p className="ps-display text-5xl leading-none">Setup fee + monthly plan</p>
              <p className="mt-3 text-slate-600">A clear pilot offer before anything goes live.</p>
            </div>
            <ul className="mt-7 space-y-4 text-slate-700">
              {setupSteps.map((step) => (
                <li key={step} className="flex gap-3">
                  <CheckMark className="mt-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            <a href={pilotHref} className="ps-pill ps-pill-dark mt-8">
              Start with your café
            </a>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl border-t border-slate-950/15 pt-14">
          <p className="ps-display max-w-5xl text-[clamp(2.6rem,6vw,5.6rem)] leading-[0.96]">
            Your café’s Wallet card can be ready this week.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={demoHref} className="ps-pill ps-pill-dark">
              Book a demo
            </a>
            <a href={pilotHref} className="ps-text-link">
              Start a café pilot
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PocketStamp.</p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:hello@getpocketstamp.com" className="hover:text-slate-950">
              hello@getpocketstamp.com
            </a>
            <a href={demoJoinUrl} className="hover:text-slate-950">
              Try the PocketStamp demo card
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function extractScannerDevice(payload = {}) {
  return (
    payload.device ||
    payload.scannerDevice ||
    payload.result?.device ||
    payload.data?.device ||
    payload.result ||
    payload.data ||
    payload
  );
}

function getScannerMerchantName(device = {}) {
  return pickFirst(
    device.merchantName,
    device.cafeName,
    device.merchant?.name,
    device.merchant?.cafeName,
    device.merchant?.displayName,
    "PocketStamp café",
  );
}

function getScannerDeviceName(device = {}) {
  return pickFirst(device.deviceName, device.name, device.label, "Counter scanner");
}

function getScanStatus(payload = {}) {
  const text = [
    payload.status,
    payload.result,
    payload.resultType,
    payload.type,
    payload.outcome,
    payload.action,
    payload.code,
    payload.scan?.status,
    payload.data?.status,
    payload.result?.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("reward") && text.includes("redeem")) return "reward_redeemed";
  if (text.includes("reward") && (text.includes("ready") || text.includes("earned"))) return "reward_ready";
  if (text.includes("already") || text.includes("cooldown") || text.includes("recent")) {
    return "already_stamped_recently";
  }
  if (text.includes("undo")) return "undo_success";
  if (text.includes("stamp") || text.includes("success") || text.includes("added")) return "stamp_added";
  return "stamp_added";
}

function getScanCustomerName(result = {}) {
  const scan = result || {};
  return pickFirst(
    scan.customerName,
    scan.customer?.name,
    scan.customer?.fullName,
    scan.customer?.firstName && scan.customer?.lastName
      ? `${scan.customer.firstName} ${scan.customer.lastName}`
      : null,
    scan.customer?.firstName,
    scan.pass?.customerName,
  );
}

function getScanStamps(result = {}) {
  const scan = result || {};
  const current = pickFirst(
    scan.currentStamps,
    scan.stamps,
    scan.stampCount,
    scan.customer?.currentStamps,
    scan.pass?.currentStamps,
  );
  const threshold = pickFirst(
    scan.rewardThreshold,
    scan.threshold,
    scan.customer?.rewardThreshold,
    scan.pass?.rewardThreshold,
  );

  if (current === undefined && threshold === undefined) return "";
  return `${current ?? "?"}/${threshold ?? "?"}`;
}

function getCooldownText(result = {}) {
  const scan = result || {};
  const seconds = Number(
    pickFirst(
      scan.cooldownSecondsRemaining,
      scan.secondsUntilNextStamp,
      scan.retryAfterSeconds,
      scan.cooldownRemainingSeconds,
    ),
  );

  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  if (seconds < 60) return `${Math.ceil(seconds)} seconds until next stamp`;
  return `${Math.ceil(seconds / 60)} minutes until next stamp`;
}

function getScanMessage(errorOrPayload) {
  return pickFirst(
    errorOrPayload?.message,
    errorOrPayload?.error,
    errorOrPayload?.details,
    errorOrPayload?.payload?.message,
    errorOrPayload?.payload?.error,
    "Please try again.",
  );
}

function getScannerBranding(device = {}) {
  const branding = device.branding || {};
  return {
    backgroundColor: pickFirst(branding.backgroundColor, device.backgroundColor, "#fbf7ef"),
    foregroundColor: pickFirst(branding.foregroundColor, device.foregroundColor, "#26211d"),
    labelColor: pickFirst(branding.labelColor, device.labelColor, "#6f6860"),
    logoPath: pickFirst(device.logoPath, device.logoUrl, branding.logoPath, branding.logoUrl),
  };
}

function isProbablyNetworkError(error) {
  return !error?.status && /fetch|network|load failed|failed to fetch/i.test(String(error?.message || ""));
}

class ScannerRenderBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Scanner page render failed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ScannerFallbackScreen
          title="Scanner screen error"
          message="Reload this scanner screen. The device token was not changed."
        />
      );
    }

    return this.props.children;
  }
}

function ScannerFallbackScreen({ title, message }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--ps-cream)] px-5 py-8 text-[var(--ps-espresso)]">
      <section className="w-full max-w-3xl rounded-[2rem] bg-red-50 p-8 text-center shadow-[var(--ps-shadow)] ring-2 ring-red-200">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-4xl font-black text-red-800 ring-1 ring-red-200">
          !
        </div>
        <h1 className="mt-6 text-[clamp(2.6rem,8vw,5.8rem)] font-black leading-none text-red-800">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-xl font-semibold leading-8 text-red-800">
          {message}
        </p>
      </section>
    </main>
  );
}

function KioskStat({ label, value }) {
  return value ? (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-[var(--ps-border)]">
      <p className="text-sm font-bold uppercase text-[var(--ps-muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[var(--ps-espresso)]">{value}</p>
    </div>
  ) : null;
}

function ScannerKioskPage() {
  const deviceToken = new URLSearchParams(window.location.search).get("deviceToken") || "";
  const inputRef = useRef(null);
  const readyTimerRef = useRef(null);
  const [device, setDevice] = useState(null);
  const [deviceError, setDeviceError] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [deviceLoadStatus, setDeviceLoadStatus] = useState("loading");
  const [scanStatus, setScanStatus] = useState("idle");
  const [scanResult, setScanResult] = useState(null);
  const [readyMessage, setReadyMessage] = useState("");
  const [recentActivity, setRecentActivity] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const merchantName = getScannerMerchantName(device || {});
  const deviceName = getScannerDeviceName(device || {});
  const scannerDeviceStatus = pickFirst(device?.status, device?.state);
  const mode = pickFirst(device?.mode, device?.scannerMode);
  const cooldown = pickFirst(device?.cooldownSeconds, device?.stampCooldownSeconds);
  const rewardThreshold = pickFirst(device?.rewardThreshold, device?.threshold);
  const scannerBranding = getScannerBranding(device || {});

  function focusScannerInput() {
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  function scheduleReady(delay = 3600) {
    window.clearTimeout(readyTimerRef.current);
    readyTimerRef.current = window.setTimeout(() => {
      setScanStatus("idle");
      setScanResult(null);
      setScanValue("");
      setReadyMessage("");
      focusScannerInput();
    }, delay);
  }

  async function loadDevice() {
    if (!deviceToken) {
      setDeviceError("Missing scanner device token.");
      setDeviceLoadStatus("missing_token");
      setScanStatus("idle");
      return;
    }

    setDeviceLoadStatus("loading");
    setScanStatus("idle");
    setDeviceError("");

    try {
      const payload = await fetchScannerDevice(deviceToken);
      setDevice(extractScannerDevice(payload));
      setDeviceLoadStatus("ready");
      setScanStatus("idle");
      setReadyMessage("");
    } catch (error) {
      const message = isProbablyNetworkError(error)
        ? "Could not connect to this scanner device."
        : getScanMessage(error);
      console.error("Scanner device fetch failed", {
        status: error?.status || "network",
        message,
        endpoint: `${API_BASE_URL}/api/merchant/scanner/device?deviceToken=[redacted]`,
      });
      setDeviceError(message);
      setDeviceLoadStatus("error");
      setScanStatus("idle");
    } finally {
      focusScannerInput();
    }
  }

  useEffect(() => {
    loadDevice();
    return () => window.clearTimeout(readyTimerRef.current);
  }, [deviceToken]);

  useEffect(() => {
    focusScannerInput();
  }, [deviceLoadStatus, scanStatus, isProcessing]);

  function addActivity(nextStatus, result) {
    const label =
      nextStatus === "stamp_added"
        ? "Stamp added"
        : nextStatus === "already_stamped_recently"
          ? "Already stamped recently"
          : nextStatus === "reward_ready"
            ? "Reward ready"
            : nextStatus === "reward_redeemed"
              ? "Reward redeemed"
              : nextStatus === "undo_success"
                ? "Stamp undone"
                : "Could not process scan";

    setRecentActivity((current) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        time: new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
        label,
        customerName: getScanCustomerName(result),
        stamps: getScanStamps(result),
      },
      ...current,
    ].slice(0, 5));
  }

  async function handleScanSubmit(value = scanValue) {
    const trimmedValue = String(value || "").trim();
    if (!trimmedValue) {
      setScanValue("");
      setReadyMessage("Enter or scan a pass code first.");
      if (deviceLoadStatus === "ready") setScanStatus("idle");
      focusScannerInput();
      return;
    }

    if (isProcessing || deviceLoadStatus !== "ready") {
      focusScannerInput();
      return;
    }

    window.clearTimeout(readyTimerRef.current);
    setIsProcessing(true);
    setScanValue("");
    setReadyMessage("");
    setScanStatus("processing");

    try {
      console.info("Scanner scan submit", {
        scanValueLength: trimmedValue.length,
        scanValuePrefix: trimmedValue.slice(0, 8),
        tokenPresent: Boolean(deviceToken),
      });
      const payload = await submitScannerScan({ deviceToken, scanValue: trimmedValue });
      const nextStatus = getScanStatus(payload);
      setScanResult(payload);
      setScanStatus(nextStatus);
      addActivity(nextStatus, payload);
      if (nextStatus !== "reward_ready") scheduleReady(nextStatus === "stamp_added" ? 3200 : 5200);
    } catch (error) {
      const errorResult = { message: getScanMessage(error) };
      setScanResult(errorResult);
      setScanStatus("scan_error");
      addActivity("scan_error", errorResult);
      scheduleReady(6200);
    } finally {
      setIsProcessing(false);
      focusScannerInput();
    }
  }

  async function handleRedeemReward() {
    if (!scanResult || isProcessing) return;
    setIsProcessing(true);

    try {
      const payload = await redeemScannerReward({ deviceToken, scanResult });
      setScanResult(payload);
      setScanStatus("reward_redeemed");
      addActivity("reward_redeemed", payload);
      scheduleReady(3600);
    } catch (error) {
      setScanResult({ message: getScanMessage(error) });
      setScanStatus("scan_error");
      scheduleReady(6200);
    } finally {
      setIsProcessing(false);
      focusScannerInput();
    }
  }

  async function handleUndoStamp() {
    if (!scanResult || isProcessing) return;
    setIsProcessing(true);

    try {
      const payload = await undoScannerStamp({ deviceToken, scanResult });
      setScanResult(payload);
      setScanStatus("undo_success");
      addActivity("undo_success", payload);
      scheduleReady(3200);
    } catch (error) {
      setScanResult({ message: getScanMessage(error) });
      setScanStatus("scan_error");
      scheduleReady(6200);
    } finally {
      setIsProcessing(false);
      focusScannerInput();
    }
  }

  const displayStatus = deviceLoadStatus === "ready"
    ? scanStatus === "idle" ? "ready" : scanStatus
    : deviceLoadStatus;

  const statusContent = {
    loading: {
      tone: "neutral",
      icon: "PS",
      title: "Connecting scanner...",
      body: "Checking this tablet can use Scanner Mode.",
    },
    ready: {
      tone: "ready",
      icon: "⌁",
      title: "Ready to scan",
      body: readyMessage || "Hold Apple Wallet pass under the scanner",
    },
    processing: {
      tone: "neutral",
      icon: "...",
      title: "Processing scan",
      body: "Keep the scanner pointed at the Wallet pass.",
    },
    stamp_added: {
      tone: "success",
      icon: "✓",
      title: "Stamp added",
      body: getScanCustomerName(scanResult) || "Wallet pass updated.",
    },
    already_stamped_recently: {
      tone: "warning",
      icon: "!",
      title: "Already stamped recently",
      body: getCooldownText(scanResult) || "This customer is still inside the cooldown window.",
    },
    reward_ready: {
      tone: "reward",
      icon: "★",
      title: "Reward ready",
      body: pickFirst(scanResult?.rewardText, scanResult?.reward?.text, "This customer has earned a reward."),
    },
    reward_redeemed: {
      tone: "success",
      icon: "✓",
      title: "Reward redeemed",
      body: getScanCustomerName(scanResult) || "Reward marked as redeemed.",
    },
    undo_success: {
      tone: "success",
      icon: "↶",
      title: "Stamp undone",
      body: getScanCustomerName(scanResult) || "Latest stamp was reversed.",
    },
    scan_error: {
      tone: "error",
      icon: "!",
      title: "Could not process scan",
      body: getScanMessage(scanResult),
    },
    error: {
      tone: "error",
      icon: "!",
      title: "Could not connect to this scanner device.",
      body: deviceError || "Reload the scanner setup URL or reconnect from PocketStamp admin.",
    },
    missing_token: {
      tone: "error",
      icon: "!",
      title: "Missing scanner device token.",
      body: "Open this page using the scanner setup URL from PocketStamp admin.",
    },
  }[displayStatus] || {};

  const toneClass =
    statusContent.tone === "success"
      ? "bg-[#e7f7f3] text-[#0f6f5f] ring-emerald-200"
      : statusContent.tone === "warning"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : statusContent.tone === "reward"
          ? "bg-[#fff7d7] text-[#5d4215] ring-[#eecf70]"
          : statusContent.tone === "error"
            ? "bg-red-50 text-red-800 ring-red-200"
            : "bg-white/78 text-[var(--ps-espresso)] ring-[var(--ps-border)]";

  return (
    <main
      className="min-h-screen px-5 py-6 sm:px-8"
      style={{
        backgroundColor: scannerBranding.backgroundColor,
        color: scannerBranding.foregroundColor,
      }}
      onClick={(event) => {
        const target = event.target;
        if (target instanceof Element && target.closest("button,input,select,textarea,a")) return;
        focusScannerInput();
      }}
    >
      <input
        ref={inputRef}
        value={scanValue}
        onChange={(event) => setScanValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleScanSubmit(event.currentTarget.value);
          }
        }}
        autoFocus
        autoCapitalize="off"
        autoComplete="off"
        spellCheck="false"
        aria-label="Scanner input"
        className="fixed left-0 top-0 h-px w-px opacity-0"
      />

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-3 rounded-3xl bg-[#fffdf8]/90 p-5 text-[var(--ps-espresso)] ring-1 ring-[var(--ps-border)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {scannerBranding.logoPath ? (
              <img
                src={scannerBranding.logoPath}
                alt=""
                className="h-14 w-14 rounded-2xl bg-white object-contain p-2 ring-1 ring-[var(--ps-border)]"
              />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--ps-espresso)] text-lg font-black text-white">
                PS
              </span>
            )}
            <div>
              <p className="text-sm font-bold uppercase" style={{ color: scannerBranding.labelColor }}>
                PocketStamp Scanner Mode
              </p>
              <h1 className="mt-1 text-2xl font-semibold">{merchantName}</h1>
              <p className="mt-1 text-sm font-semibold" style={{ color: scannerBranding.labelColor }}>
                {deviceName}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-semibold text-[var(--ps-muted)]">
            {scannerDeviceStatus ? <span className="rounded-full bg-white px-3 py-2 ring-1 ring-[var(--ps-border)]">{toTitle(scannerDeviceStatus)}</span> : null}
            {mode ? <span className="rounded-full bg-white px-3 py-2 ring-1 ring-[var(--ps-border)]">{toTitle(mode)}</span> : null}
            {cooldown ? <span className="rounded-full bg-white px-3 py-2 ring-1 ring-[var(--ps-border)]">{cooldown}s cooldown</span> : null}
            {rewardThreshold ? <span className="rounded-full bg-white px-3 py-2 ring-1 ring-[var(--ps-border)]">{rewardThreshold} stamps</span> : null}
          </div>
        </header>

        <section className={`grid flex-1 place-items-center rounded-[2rem] p-7 text-center shadow-[var(--ps-shadow)] ring-2 ${toneClass}`}>
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white/70 text-5xl font-black ring-1 ring-current/15">
              {statusContent.icon}
            </div>
            <h2 className="mt-8 text-[clamp(3.2rem,9vw,7.4rem)] font-black leading-[0.92] tracking-normal">
              {statusContent.title}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[clamp(1.35rem,3vw,2.2rem)] font-semibold leading-tight">
              {statusContent.body}
            </p>

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
              <KioskStat label="Customer" value={getScanCustomerName(scanResult)} />
              <KioskStat label="Stamps" value={getScanStamps(scanResult)} />
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              {displayStatus === "stamp_added" ? (
                <button
                  type="button"
                  onClick={handleUndoStamp}
                  disabled={isProcessing}
                  className="ps-button-secondary bg-white text-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Undo last stamp
                </button>
              ) : null}
              {displayStatus === "reward_ready" ? (
                <>
                  <button
                    type="button"
                    onClick={handleRedeemReward}
                    disabled={isProcessing}
                    className="ps-button-primary bg-[var(--ps-espresso)] text-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Redeem reward
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScanStatus("idle");
                      setScanResult(null);
                      focusScannerInput();
                    }}
                    className="ps-button-secondary bg-white text-lg"
                  >
                    Cancel / Back to ready
                  </button>
                </>
              ) : null}
              {displayStatus === "scan_error" || displayStatus === "error" ? (
                <>
                  <button type="button" onClick={loadDevice} className="ps-button-secondary bg-white text-lg">
                    Reconnect scanner
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (deviceLoadStatus === "ready") {
                        setScanStatus("idle");
                      } else {
                        loadDevice();
                      }
                      setScanResult(null);
                      focusScannerInput();
                    }}
                    className="ps-button-secondary bg-white text-lg"
                  >
                    Back to ready
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <footer className="grid gap-4 lg:grid-cols-[1fr_24rem]">
          <div className="rounded-2xl bg-[#fffdf8]/82 p-4 ring-1 ring-[var(--ps-border)]">
            <p className="text-sm font-bold uppercase text-[var(--ps-muted)]">Recent activity</p>
            <div className="mt-3 grid gap-2">
              {recentActivity.length ? recentActivity.filter(Boolean).map((item, index) => (
                <div key={item.id || `scan-activity-${index}`} className="grid gap-2 rounded-xl bg-white p-3 text-sm ring-1 ring-[var(--ps-border)] sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                  <span className="font-semibold text-[var(--ps-muted)]">{item.time || "Recent"}</span>
                  <span className="font-bold">{item.label || "Scan"}</span>
                  <span className="font-semibold text-[var(--ps-muted)]">
                    {[item.customerName, item.stamps].filter(Boolean).join(" · ") || "No details"}
                  </span>
                </div>
              )) : (
                <p className="rounded-xl bg-white p-3 text-sm font-semibold text-[var(--ps-muted)] ring-1 ring-[var(--ps-border)]">
                  No scans yet.
                </p>
              )}
            </div>
          </div>
          <form
            className="rounded-2xl bg-[#fffdf8]/82 p-4 ring-1 ring-[var(--ps-border)]"
            onSubmit={(event) => {
              event.preventDefault();
              handleScanSubmit(scanValue);
            }}
          >
            <label className="block">
              <span className="text-sm font-bold uppercase text-[var(--ps-muted)]">Manual scan</span>
              <input
                value={scanValue}
                onChange={(event) => setScanValue(event.target.value)}
                className="ps-input mt-3 bg-white"
                placeholder="Paste or type a pass code"
                disabled={isProcessing}
              />
            </label>
            <button type="submit" disabled={isProcessing} className="ps-button-secondary mt-3 w-full bg-white disabled:cursor-not-allowed disabled:opacity-60">
              Submit scan
            </button>
          </form>
        </footer>
      </div>
    </main>
  );
}

export default function App() {
  const pathname = window.location.pathname;

  if (pathname === demoJoinUrl) {
    return <DemoJoinPage />;
  }

  if (pathname === demoSuccessUrl) {
    return <DemoSuccessPage />;
  }

  if (pathname === "/merchant/setup") {
    return <MerchantSetupPage />;
  }

  if (pathname === "/merchant/scanner") {
    return (
      <ScannerRenderBoundary>
        <ScannerKioskPage />
      </ScannerRenderBoundary>
    );
  }

  if (pathname.startsWith("/merchant")) {
    return <MerchantPortal />;
  }

  if (pathname.startsWith("/admin")) {
    return <AdminPortal path={pathname} />;
  }

  return <MarketingHomepage />;
}
