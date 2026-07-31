import { useEffect, useEffectEvent, useRef, useState } from "react";
import MerchantLayout from "./MerchantLayout.jsx";
import MerchantOverview from "./pages/MerchantOverview.jsx";
import MerchantCustomers from "./pages/MerchantCustomers.jsx";
import MerchantActivity from "./pages/MerchantActivity.jsx";
import MerchantGetCustomers from "./pages/MerchantGetCustomers.jsx";
import MerchantMarketing from "./pages/MerchantMarketing.jsx";
import { buildMerchantJoinUrl } from "./utils/joinUrl.js";
import { getBirthdayRewardsSetting } from "./utils/merchantData.js";
import { getMerchantPageDatasets } from "./utils/dashboardRefresh.js";
import {
  fetchMerchantActivity,
  fetchMerchantCampaigns,
  fetchMerchantCustomers,
  fetchMerchantDashboardSummary,
  fetchMerchantReminderSummary,
} from "./api/merchantApi.js";
import { normalizeCampaignRows } from "../merchantCampaigns.js";

const DATA_CHANGED_EVENT = "pocketstamp:merchant-data-changed";
const DATA_CHANGED_STORAGE_KEY = "pocketstampMerchantDataChangedAt";
const REFRESH_INTERVAL_MS = 20000;
const PUBLIC_SITE_URL = "https://getpocketstamp.com";

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function extractRows(payload, keys) {
  const candidates = [payload, ...keys.map((key) => payload?.[key]), payload?.data];
  return candidates.find(Array.isArray) || [];
}

function toPublicScannerUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, PUBLIC_SITE_URL);
    return new URL(`${url.pathname}${url.search}${url.hash}`, PUBLIC_SITE_URL).toString();
  } catch {
    return value;
  }
}

function formatLastScan(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getScannerDashboardData(summary = {}) {
  const scanner = [
    summary.scanner,
    summary.scannerMode,
    summary.scannerStatus,
    summary.scannerDevice,
    summary.device,
    summary.devices?.[0],
    summary.scannerDevices?.[0],
    summary.counterScanner,
  ].find(Boolean);
  const device = summary.scannerDevices?.[0] || summary.devices?.[0] || scanner;
  const scannerUrl = toPublicScannerUrl(pickFirst(
    scanner?.scannerUrl,
    scanner?.scannerURL,
    scanner?.kioskUrl,
    scanner?.kioskURL,
    scanner?.url,
    device?.scannerUrl,
    device?.kioskUrl,
  ));
  return {
    scannerUrl,
    lastScan: formatLastScan(pickFirst(device?.lastScanAt, scanner?.lastScanAt, scanner?.lastScan?.createdAt)),
  };
}

export default function MerchantDashboard({
  accessToken,
  merchantContext,
  onLogout,
  onNavigate,
  page = "overview",
}) {
  const isMountedRef = useRef(false);
  const isDashboardRefreshInFlightRef = useRef(false);
  const isCustomerRefreshInFlightRef = useRef(false);
  const isCampaignRefreshInFlightRef = useRef(false);
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
  const [manualRefreshState, setManualRefreshState] = useState("idle");
  const [campaignRows, setCampaignRows] = useState([]);
  const [campaignError, setCampaignError] = useState("");
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(true);

  const merchantSlug = merchantContext.merchantSlug || "";
  const joinUrl = buildMerchantJoinUrl(merchantSlug);
  const birthdayRewardsEnabled =
    pickFirst(
      getBirthdayRewardsSetting(merchantContext),
      getBirthdayRewardsSetting(dashboardSummary || {}),
    ) === true;
  const effectiveCustomerStatus = birthdayRewardsEnabled || customerStatus !== "birthday_saved"
    ? customerStatus
    : "all";

  async function refreshDashboardData({ showLoading = false } = {}) {
    if (isDashboardRefreshInFlightRef.current) return;
    isDashboardRefreshInFlightRef.current = true;

    if (showLoading) {
      setIsActivityLoading(true);
      setIsDashboardSummaryLoading(true);
      setIsReminderSummaryLoading(true);
    }
    setActivityError("");
    setDashboardSummaryError("");
    setReminderError("");

    try {
      const [activityResult, dashboardResult, reminderResult] = await Promise.allSettled([
        fetchMerchantActivity(accessToken),
        fetchMerchantDashboardSummary(accessToken),
        fetchMerchantReminderSummary(accessToken),
      ]);

      if (!isMountedRef.current) return;

      if (activityResult.status === "fulfilled") {
        setActivityRows(extractRows(activityResult.value, ["activity", "activities", "events", "items"]));
      } else {
        setActivityError("We couldn’t load recent activity right now.");
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
        setDashboardSummaryError("We couldn’t load dashboard totals right now.");
      }

      if (reminderResult.status === "fulfilled") {
        setReminderSummary(reminderResult.value?.summary || null);
      } else {
        setReminderError("We couldn’t load reminder information right now.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsActivityLoading(false);
        setIsDashboardSummaryLoading(false);
        setIsReminderSummaryLoading(false);
      }
      isDashboardRefreshInFlightRef.current = false;
    }
  }

  async function refreshCustomers({ showLoading = false } = {}) {
    if (isCustomerRefreshInFlightRef.current) return;
    isCustomerRefreshInFlightRef.current = true;

    if (showLoading) {
      setIsCustomersLoading(true);
    }
    setCustomerError("");

    try {
      const payload = await fetchMerchantCustomers(accessToken, {
        search: customerSearch,
        status: effectiveCustomerStatus === "scanned_today" ? "all" : effectiveCustomerStatus,
        limit: 50,
      });

      if (!isMountedRef.current) return;
      setCustomerRows(extractRows(payload, ["customers", "items"]));
    } catch {
      if (!isMountedRef.current) return;
      setCustomerError("We couldn’t load loyalty customers right now.");
    } finally {
      if (isMountedRef.current) {
        setIsCustomersLoading(false);
      }
      isCustomerRefreshInFlightRef.current = false;
    }
  }

  async function refreshCampaigns({ showLoading = false } = {}) {
    if (isCampaignRefreshInFlightRef.current) return;
    isCampaignRefreshInFlightRef.current = true;
    if (showLoading) setIsCampaignsLoading(true);
    setCampaignError("");
    try {
      const payload = await fetchMerchantCampaigns(accessToken);
      if (!isMountedRef.current) return;
      setCampaignRows(normalizeCampaignRows(payload));
    } catch {
      if (!isMountedRef.current) return;
      setCampaignError("We couldn’t load campaign history right now.");
    } finally {
      if (isMountedRef.current) setIsCampaignsLoading(false);
      isCampaignRefreshInFlightRef.current = false;
    }
  }

  function refreshCurrentPageData({ showLoading = false } = {}) {
    const refreshers = {
      dashboard: refreshDashboardData,
      customers: refreshCustomers,
      campaigns: refreshCampaigns,
    };
    return Promise.all(
      getMerchantPageDatasets(page).map((dataset) => refreshers[dataset]({ showLoading })),
    );
  }

  const onRefreshCurrentPageData = useEffectEvent(refreshCurrentPageData);
  const onRefreshCustomers = useEffectEvent(refreshCustomers);

  useEffect(() => {
    isMountedRef.current = true;
    onRefreshCurrentPageData({ showLoading: true });
    return () => {
      isMountedRef.current = false;
    };
  }, [accessToken, page]);

  useEffect(() => {
    if (page !== "customers") return;
    let isCancelled = false;
    Promise.resolve().then(() => {
      if (!isCancelled) onRefreshCustomers({ showLoading: true });
    });
    return () => {
      isCancelled = true;
    };
  }, [accessToken, customerSearch, effectiveCustomerStatus, page]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      onRefreshCurrentPageData({ showLoading: false });
    }, REFRESH_INTERVAL_MS);

    function handleFocus() {
      onRefreshCurrentPageData({ showLoading: false });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        onRefreshCurrentPageData({ showLoading: false });
      }
    }

    function handleMerchantDataChanged() {
      onRefreshCurrentPageData({ showLoading: false });
    }

    function handleStorage(event) {
      if (event.key === DATA_CHANGED_STORAGE_KEY) {
        onRefreshCurrentPageData({ showLoading: false });
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(DATA_CHANGED_EVENT, handleMerchantDataChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(DATA_CHANGED_EVENT, handleMerchantDataChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [accessToken, customerSearch, effectiveCustomerStatus, page]);

  const scannerDashboard = getScannerDashboardData(dashboardSummary || {});
  const currentPageHasError = page === "overview"
    ? Boolean(activityError || dashboardSummaryError || reminderError)
    : page === "customers"
      ? Boolean(customerError)
      : page === "activity"
        ? Boolean(activityError)
        : page === "marketing"
          ? Boolean(campaignError || reminderError)
          : false;

  async function handleCopyJoinUrl() {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  async function handleManualRefresh() {
    setManualRefreshState("refreshing");

    try {
      await refreshCurrentPageData({ showLoading: false });
      setManualRefreshState("done");
    } catch {
      setManualRefreshState("failed");
    }

    window.setTimeout(() => setManualRefreshState("idle"), 1600);
  }

  function handleCustomerSearchChange(nextSearch) {
    setCustomerSearch(nextSearch);
    setExpandedCustomerId(null);
  }

  function handleCustomerStatusChange(nextStatus) {
    setCustomerStatus(nextStatus);
    setExpandedCustomerId(null);
  }

  const pageTitles = {
    overview: "Overview",
    customers: "Customers",
    activity: "Activity",
    marketing: "Marketing",
    "get-customers": "Get Customers",
  };

  return (
    <MerchantLayout
      merchantContext={merchantContext}
      page={page}
      pageTitle={pageTitles[page]}
      scannerUrl={scannerDashboard.scannerUrl || ""}
      onLogout={onLogout}
      onNavigate={onNavigate}
      onRefresh={handleManualRefresh}
      refreshLabel={
        manualRefreshState === "refreshing"
          ? "Refreshing..."
          : currentPageHasError
            ? "Retry"
            : "Refresh"
      }
    >
      {page === "overview" ? (
        <MerchantOverview
          dashboardSummary={dashboardSummary}
          dashboardSummaryError={dashboardSummaryError}
          isDashboardSummaryLoading={isDashboardSummaryLoading}
          activityContent={(
            <MerchantActivity
              activityRows={activityRows}
              isLoading={isActivityLoading}
              error={activityError}
              birthdayRewardsEnabled={birthdayRewardsEnabled}
              preview
            />
          )}
          scanner={scannerDashboard}
          reminderSummary={reminderSummary}
          reminderError={reminderError}
          isReminderSummaryLoading={isReminderSummaryLoading}
          joinUrl={joinUrl}
          copyState={copyState}
          onCopyJoinUrl={handleCopyJoinUrl}
        />
      ) : null}

      {page === "customers" ? (
        <MerchantCustomers
          customers={customerRows}
          isLoading={isCustomersLoading}
          error={customerError}
          search={customerSearch}
          onSearchChange={handleCustomerSearchChange}
          status={effectiveCustomerStatus}
          onStatusChange={handleCustomerStatusChange}
          expandedCustomerId={expandedCustomerId}
          onExpandedCustomerChange={setExpandedCustomerId}
          birthdayRewardsEnabled={birthdayRewardsEnabled}
        />
      ) : null}

      {page === "activity" ? (
          <MerchantActivity
            activityRows={activityRows}
            isLoading={isActivityLoading}
            error={activityError}
            birthdayRewardsEnabled={birthdayRewardsEnabled}
          />
      ) : null}

      {page === "marketing" ? (
        <MerchantMarketing
          accessToken={accessToken}
          merchantContext={merchantContext}
          campaigns={campaignRows}
          isLoading={isCampaignsLoading}
          error={campaignError}
          onRefresh={() => refreshCampaigns({ showLoading: false })}
          reminderSummary={reminderSummary}
          isReminderSummaryLoading={isReminderSummaryLoading}
          reminderError={reminderError}
          birthdayRewardsEnabled={birthdayRewardsEnabled}
        />
      ) : null}

      {page === "get-customers" ? (
        <MerchantGetCustomers
          joinUrl={joinUrl}
          copyState={copyState}
          onCopyJoinUrl={handleCopyJoinUrl}
        />
      ) : null}
    </MerchantLayout>
  );
}
