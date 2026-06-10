import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

const API_BASE_URL = "https://pocketstamp-wallet-backend-production.up.railway.app";
const TOKEN_STORAGE_KEY = "pocketstampMerchantAccessToken";

const demoHref =
  "mailto:hello@getpocketstamp.com?subject=PocketStamp demo enquiry";
const pilotHref =
  "mailto:hello@getpocketstamp.com?subject=PocketStamp café pilot";

const problems = [
  ["Lost cards", "Paper cards are familiar, but easy to lose."],
  ["App fatigue", "Customers do not want another loyalty app."],
  ["Passive loyalty", "Paper cards cannot remind customers when they are close to a reward."],
];

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
  "No customer app",
  "Always on their phone",
  "Updates automatically",
  "Replaces the paper stamp card",
];

const readerBullets = [
  ["Dedicated reader at the till", "A countertop device for fast loyalty taps."],
  [
    "Connects to PocketStamp",
    "Reader events are routed to your backend so stamps update automatically.",
  ],
  ["Minimal staff action", "Customers tap. PocketStamp records the stamp."],
  [
    "Built for compatible Wallet readers",
    "Designed around Apple Wallet VAS-compatible reader workflows, including VTAP-style hardware.",
  ],
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

const stats = [
  ["0", "apps to download"],
  ["1", "tap to collect"],
  ["24/7", "Wallet access"],
  ["100%", "branded"],
];

const setupSteps = [
  "Send your logo, colours and reward",
  "We build your Wallet card and join page",
  "You get your dashboard, QR code and reader setup",
  "Customers start joining",
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
  let payload = null;

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
    item.customer?.name,
    item.customer?.fullName,
    item.customer?.firstName && item.customer?.lastName
      ? `${item.customer.firstName} ${item.customer.lastName}`
      : null,
    item.customer?.firstName,
  );
}

function isToday(timestamp) {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.toDateString() === today.toDateString();
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

function formatActivityTime(timestamp) {
  if (!timestamp) return "Recent";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Recent";
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
    return "Wallet pass created";
  }
  if (looksLikeWalletPass(item)) return "Wallet pass updated";

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

function formatActivityBadge(item) {
  if (looksLikeBirthdayReward(item)) return "Birthday";
  if (looksLikeStamp(item)) return "Stamp";
  if (looksLikeReward(item)) return "Redeemed";
  if (looksLikeReminder(item)) return "Reminder";
  if (looksLikeJoin(item)) return "Joined";
  if (looksLikeWalletPass(item)) return "Wallet";
  return toTitle(getActivityType(item));
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
      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e7f7f3] text-xs font-bold text-[#16856f] ${className}`}
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
      <div className="rounded-[34px] bg-slate-950 p-3 shadow-2xl shadow-slate-900/20">
        <div className="rounded-[28px] bg-white p-3">
          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <div className="bg-[#143d3b] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <IconMark label="PS" className="h-12 w-12 bg-white text-[#143d3b]" />
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-[#f4c15d]" />
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
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Reward
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">
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

function HardwareMockup() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="relative min-h-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200">
        <div className="absolute left-8 top-8 rounded-full bg-[#e7f7f3] px-4 py-2 text-xs font-semibold text-[#16856f]">
          Ready for Wallet tap
        </div>

        <div className="absolute bottom-16 left-10 h-32 w-64 rounded-2xl bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/25">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-white/40">
                Reader 01
              </p>
              <p className="mt-1 text-lg font-semibold">Counter till</p>
            </div>
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/8">
              <span className="text-lg font-bold text-[#63c7b2]">)))</span>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#63c7b2]" />
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <span className="h-2 w-2 rounded-full bg-[#63c7b2]" />
            <span className="h-2 w-2 rounded-full bg-[#63c7b2]/70" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
          </div>
        </div>

        <div className="absolute bottom-28 left-44 flex h-52 w-52 items-center justify-center rounded-full border border-[#63c7b2]/20">
          <span className="absolute h-36 w-36 rounded-full border border-[#63c7b2]/35" />
          <span className="absolute h-24 w-24 rounded-full border border-[#63c7b2]/55" />
          <span className="text-xl font-bold text-[#16856f]">)))</span>
        </div>

        <div className="absolute right-10 top-24 w-60 rotate-6 rounded-[32px] bg-slate-950 p-2 shadow-2xl shadow-slate-900/25">
          <div className="rounded-[26px] bg-white p-3">
            <div className="rounded-xl bg-[#143d3b] p-5 text-white">
              <div className="flex items-center justify-between">
                <IconMark label="PS" className="h-7 w-7 bg-white text-[#143d3b]" />
                <span className="text-sm font-bold text-[#f4c15d]">Wallet</span>
              </div>
              <p className="mt-9 text-xs font-semibold uppercase text-white/60">
                PocketStamp
              </p>
              <p className="mt-1 text-lg font-semibold">Harbour House</p>
              <p className="mt-5 text-xs font-semibold uppercase text-white/55">
                Stamps
              </p>
              <p className="mt-1 text-4xl font-semibold">0/10</p>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-1.5">
              {Array.from({ length: 10 }).map((_, index) => (
                <span key={index} className="aspect-square rounded-full bg-slate-200" />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 right-10 rounded-xl bg-white px-4 py-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200">
          <div className="flex items-center gap-2">
            <CheckMark className="mt-0" />
            <p className="text-sm font-semibold text-slate-950">Stamp added</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">Pass update sent</p>
        </div>
      </div>
    </div>
  );
}

function ReminderMockup() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="overflow-hidden rounded-3xl bg-[#fbfaf7] p-3 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200">
        <img
          src="/wallet-reminders-mockup.png"
          alt="iPhone lock screen showing PocketStamp Wallet reminder notifications"
          className="block w-full rounded-[22px]"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="mt-5 rounded-2xl bg-white p-5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200">
        <p className="text-lg font-semibold text-slate-950">
          Automated Apple Wallet reminders
        </p>
        <p className="mt-2 leading-7 text-slate-600">
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
      <div className="rounded-2xl bg-white p-5 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              PocketStamp dashboard
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              Today at Harbour House
            </p>
          </div>
          <div className="rounded-xl bg-[#e7f7f3] p-3 text-[#16856f]">
            <span className="text-xs font-bold">Live</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["126", "customers"],
            ["48", "stamps"],
            ["9", "rewards"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-semibold text-slate-950">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          {rows.map(([time, event, tag]) => (
            <div
              key={`${time}-${event}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">{event}</p>
                <p className="mt-0.5 text-xs text-slate-500">{time}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                {tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, body }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase text-[#16856f]">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-semibold text-slate-950 sm:text-5xl">
        {title}
      </h2>
      {body ? <p className="mt-5 text-lg leading-8 text-slate-600">{body}</p> : null}
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
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
          {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
        </div>
        <div className="rounded-xl bg-[#e7f7f3] p-3 text-[#16856f]">
          <span className="text-xs font-bold">{iconLabel}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityList({ activityRows, isLoading, error }) {
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
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      {activityRows.map((item, index) => (
        <div
          key={pickFirst(item.id, item._id, item.eventId, `${index}-${getActivityTimestamp(item)}`)}
          className="flex flex-col gap-3 border-b border-slate-100 p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-slate-950">{formatActivityTitle(item)}</p>
            <p className="mt-1 text-sm text-slate-500">
              {formatActivityTime(getActivityTimestamp(item))}
              {formatActivityMeta(item) ? ` · ${formatActivityMeta(item)}` : ""}
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#e7f7f3] px-3 py-1 text-sm font-semibold text-[#16856f]">
            {formatActivityBadge(item)}
          </span>
        </div>
      ))}
    </div>
  );
}

const customerFilters = [
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
  const customerSummary = isLoading
    ? "Loading customers"
    : `Showing ${customers.length} ${
        customers.length === 1 ? "customer" : "customers"
      }`;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">
            Loyalty Customers
          </h2>
          <p className="mt-1 max-w-2xl text-slate-500">
            See the customers who have joined your Apple Wallet loyalty program.
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
        ) : !customers.length ? (
          <div className="p-5 text-slate-600">
            No loyalty customers yet. Customers will appear here when they create an Apple Wallet card.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {customers.map((customer, index) => {
              const customerId = getCustomerId(customer, index);
              const customerStatus = getCustomerStatus(customer);
              const isExpanded = expandedCustomerId === customerId;
              const detailRows = [
                ["Joined", formatCustomerDate(customer.joinedDate)],
                ["Birthday", formatCustomerBirthday(customer)],
                ["Wallet pass", formatCustomerWalletStatus(customer)],
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
    ["Halfway reminder", "Active", "Sent when a customer reaches the middle of their stamp card."],
    ["Almost-there reminder", "Active", "Sent when a customer is close to earning a reward."],
    ["Reward-ready reminder", "Active", "Sent when a customer has earned a reward."],
    [
      "Birthday rewards",
      "Active",
      "Customers can add their birthday when joining. PocketStamp can make their Wallet pass reward-ready on their birthday.",
    ],
    [
      "Win-back reminders",
      "Active",
      "Automatically reminds customers who have not visited in 30 days.",
    ],
  ];

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-[#16856f]">
            Wallet reminders
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Automated reminders
          </h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            PocketStamp automatically reminds customers through Apple Wallet
            when they’re close to a reward or have earned one.
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

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {reminderRows.map(([title, status, body]) => (
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
            <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
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
            "Unable to load dashboard summary right now.",
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
          status: customerStatus,
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

  const metricFallback = dashboardSummaryError ? "Summary unavailable" : "—";
  const metricHelperFallback = dashboardSummaryError
    ? "Dashboard summary could not be loaded."
    : "Loading summary...";

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
    <main className="min-h-screen bg-[#fbfaf7] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#143d3b] text-white">
              PS
            </span>
            <div>
              <p className="text-sm font-semibold uppercase text-[#16856f]">
                PocketStamp Merchant
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                {merchantContext.merchantName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {merchantContext.locationName} · {merchantContext.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
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
                : "From dashboard summary."
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
                : "From dashboard summary."
            }
            iconLabel="✓"
          />
          <OverviewCard
            label="Reader status"
            value="Ready"
            helper="Ready for reader events."
            iconLabel="Tap"
          />
        </div>

        <div className="mt-8">
          <ReminderStatusSection
            summary={reminderSummary}
            isLoading={isReminderSummaryLoading}
            error={reminderError}
          />
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
                <h2 className="text-2xl font-semibold text-slate-950">
                  Recent activity
                </h2>
                <p className="mt-1 text-slate-500">
                  Latest joins, stamps and rewards from the backend.
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
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    Join URL
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Share this branded link or display the counter QR code.
                  </p>
                </div>
                <span className="text-sm font-bold text-[#16856f]">QR</span>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800 break-all">
                {joinUrl}
              </div>

              <DashboardQrCode value={joinUrl} />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCopyJoinUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#143d3b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f302f]"
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  Open
                </a>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[#e7f7f3] p-3 text-[#16856f]">
                  <span className="text-xs font-bold">Tap</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    Reader/device
                  </h2>
                  <p className="mt-3 font-semibold text-slate-800">
                    Reader integration: VTAP-style endpoint prepared
                  </p>
                  <p className="mt-2 leading-7 text-slate-500">
                    Next: connect hardware reader once Apple/VAS details are
                    confirmed.
                  </p>
                </div>
              </div>
            </div>
          </aside>
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
    <main className="min-h-screen bg-[#fbfaf7] text-slate-950">
      <section className="bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="PocketStamp home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#143d3b] text-white">
              PS
            </span>
            <span className="text-xl font-semibold">PocketStamp</span>
          </a>
          <a
            href={demoHref}
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book a demo
          </a>
        </nav>

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Apple Wallet loyalty for cafés
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl lg:text-7xl">
              Paper stamp cards, rebuilt for Apple Wallet.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">
              Customers add your branded café rewards card to Apple Wallet,
              tap in-store to collect stamps, and receive simple Wallet
              reminders when they are close to a reward. No customer app. No
              paper cards. No extra staff app.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={demoHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#143d3b] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#0f302f]"
              >
                Book a demo →
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-950 transition hover:border-slate-400"
              >
                See how it works
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <WalletPassMockup hero />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Why change
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950">
              A stamp card that brings people back.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              A paper stamp card rewards customers when they come back.
              PocketStamp helps bring them back.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {problems.map(([title, body]) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-lg font-semibold text-slate-950">{title}</p>
                <p className="mt-3 leading-7 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeader
            eyebrow="How it works"
            title="Four steps from QR to repeat visit."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, body, iconLabel], index) => (
              <div key={title} className="rounded-2xl bg-[#fbfaf7] p-6 ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f7f3] text-[#16856f]">
                    <span className="text-xs font-bold">{iconLabel}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-slate-500">
            Designed around compatible Apple Wallet reader workflows, including
            VTAP-style Apple VAS-compatible hardware.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <WalletPassMockup />
          <div>
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Branded Wallet cards
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950">
              Your café, inside your customer’s Wallet.
            </h2>
            <SimpleBullets items={walletBullets} />
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Wallet reminders
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950 sm:text-5xl">
              A stamp card that helps bring customers back.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Paper cards wait for customers to remember them. PocketStamp can
              automatically remind customers through Apple Wallet when they are
              halfway there, close to a reward, or have a birthday treat waiting.
            </p>
            <FeatureBullets items={reminderBullets} />
          </div>
          <ReminderMockup />
        </div>
      </section>

      <section className="bg-[#eef8f5] py-24">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Counter hardware
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950 sm:text-5xl">
              Tap-to-stamp hardware reader
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              A small counter reader lets customers collect stamps with a quick
              tap of their iPhone or Apple Watch.
            </p>
            <FeatureBullets items={readerBullets} />
            <a
              href={demoHref}
              className="mt-9 inline-flex items-center gap-2 font-semibold text-[#143d3b] hover:text-[#0f302f]"
            >
              Hardware reader setup →
            </a>
          </div>
          <HardwareMockup />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <DashboardMockup />
          <div>
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Merchant dashboard
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950">
              See every stamp, customer and reward.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Your dashboard shows what happened today, who joined, and which
              rewards were redeemed.
            </p>
            <SimpleBullets items={dashboardBullets} />
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-4 lg:px-8">
          {stats.map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-white/5 p-6">
              <p className="text-4xl font-semibold text-[#f4c15d]">{value}</p>
              <p className="mt-3 text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeader eyebrow="Setup" title="Set up in days, not months." />
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
            {setupSteps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-2xl bg-[#fbfaf7] p-6 ring-1 ring-slate-200">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="leading-7 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="rounded-3xl bg-[#143d3b] p-8 text-white shadow-2xl shadow-[#143d3b]/15 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-4xl font-semibold">
                Ready to replace paper stamp cards?
              </h2>
              <p className="mt-4 text-lg text-white/75">
                Pilot spaces available for independent cafés.
              </p>
              <p className="mt-2 text-lg text-white/75">
                Turn your stamp card into an automated comeback system.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={demoHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[#143d3b] transition hover:bg-slate-100"
              >
                Book a demo →
              </a>
              <a
                href={pilotHref}
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Start a café pilot
              </a>
            </div>
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
            <a href="/join/without-borders" className="hover:text-slate-950">
              Example join URL
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function App() {
  const pathname = window.location.pathname;

  if (pathname.startsWith("/merchant")) {
    return <MerchantPortal />;
  }

  return <MarketingHomepage />;
}
