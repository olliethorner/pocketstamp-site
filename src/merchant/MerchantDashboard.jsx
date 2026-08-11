import { useEffect, useEffectEvent, useRef, useState } from "react";
import MerchantLayout from "./MerchantLayout.jsx";
import MerchantOverview from "./pages/MerchantOverview.jsx";
import MerchantCustomers from "./pages/MerchantCustomers.jsx";
import MerchantActivity from "./pages/MerchantActivity.jsx";
import MerchantGetCustomers from "./pages/MerchantGetCustomers.jsx";
import MerchantMarketing from "./pages/MerchantMarketing.jsx";
import { buildMerchantJoinUrl } from "./utils/joinUrl.js";
import { getBirthdayRewardsSetting } from "./utils/merchantData.js";
import { CUSTOMER_PAGE_SIZE } from "./utils/customerData.js";
import { getMerchantPageDatasets } from "./utils/dashboardRefresh.js";
import {
  fetchMerchantActivity,
  fetchMerchantCampaigns,
  fetchMerchantCustomers,
  fetchMerchantDashboardSummary,
  fetchMerchantScannerLaunchOptions,
  fetchMerchantReminderSummary,
  createMerchantScannerLaunch,
} from "./api/merchantApi.js";
import { normalizeCampaignRows } from "../merchantCampaigns.js";

const DATA_CHANGED_EVENT = "pocketstamp:merchant-data-changed";
const DATA_CHANGED_STORAGE_KEY = "pocketstampMerchantDataChangedAt";
const REFRESH_INTERVAL_MS = 20000;

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function extractRows(payload, keys) {
  const candidates = [payload, ...keys.map((key) => payload?.[key]), payload?.data];
  return candidates.find(Array.isArray) || [];
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
  const activityRequestGenerationRef = useRef(0);
  const customerRequestGenerationRef = useRef(0);
  const isCampaignRefreshInFlightRef = useRef(false);
  const [activityRows, setActivityRows] = useState([]);
  const [activityError, setActivityError] = useState("");
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [activityHistoryRows, setActivityHistoryRows] = useState([]);
  const [activityHistoryError, setActivityHistoryError] = useState("");
  const [isActivityHistoryLoading, setIsActivityHistoryLoading] = useState(true);
  const [activityPeriod, setActivityPeriod] = useState("all");
  const [activityPagination, setActivityPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
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
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
  const [customerStatus, setCustomerStatus] = useState("all");
  const [customerPagination, setCustomerPagination] = useState({ page: 1, pageSize: CUSTOMER_PAGE_SIZE, total: 0, totalPages: 0 });
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [copyState, setCopyState] = useState("idle");
  const [manualRefreshState, setManualRefreshState] = useState("idle");
  const [campaignRows, setCampaignRows] = useState([]);
  const [campaignError, setCampaignError] = useState("");
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(true);
  const [scannerDevices, setScannerDevices] = useState([]);
  const [isScannerLoading, setIsScannerLoading] = useState(true);
  const [scannerError, setScannerError] = useState("");

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
    const requestGeneration = ++customerRequestGenerationRef.current;

    if (showLoading) {
      setIsCustomersLoading(true);
    }
    setCustomerError("");

    try {
      const payload = await fetchMerchantCustomers(accessToken, {
        search: debouncedCustomerSearch,
        status: effectiveCustomerStatus === "scanned_today" ? "all" : effectiveCustomerStatus,
        page: customerPagination.page,
        pageSize: CUSTOMER_PAGE_SIZE,
      });

      if (!isMountedRef.current || requestGeneration !== customerRequestGenerationRef.current) return;
      setCustomerRows(extractRows(payload, ["customers", "items"]));
      setCustomerPagination(payload?.pagination || { page: 1, pageSize: CUSTOMER_PAGE_SIZE, total: 0, totalPages: 0 });
    } catch {
      if (!isMountedRef.current || requestGeneration !== customerRequestGenerationRef.current) return;
      setCustomerError("We couldn’t load loyalty customers right now.");
    } finally {
      if (isMountedRef.current && requestGeneration === customerRequestGenerationRef.current) {
        setIsCustomersLoading(false);
      }
    }
  }

  async function refreshActivityHistory({ showLoading = false } = {}) {
    const requestGeneration = ++activityRequestGenerationRef.current;
    if (showLoading) setIsActivityHistoryLoading(true);
    setActivityHistoryError("");
    try {
      const payload = await fetchMerchantActivity(accessToken, { page: activityPagination.page, pageSize: 25, period: activityPeriod });
      if (!isMountedRef.current || requestGeneration !== activityRequestGenerationRef.current) return;
      setActivityHistoryRows(extractRows(payload, ["activity", "activities", "events", "items"]));
      setActivityPagination(payload?.pagination || { page: 1, pageSize: 25, total: 0, totalPages: 0 });
    } catch {
      if (!isMountedRef.current || requestGeneration !== activityRequestGenerationRef.current) return;
      setActivityHistoryError("We couldn’t load activity history right now.");
    } finally {
      if (isMountedRef.current && requestGeneration === activityRequestGenerationRef.current) setIsActivityHistoryLoading(false);
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

  async function refreshScannerOptions({ showLoading = false } = {}) {
    if (showLoading) setIsScannerLoading(true);
    setScannerError("");
    try {
      const payload = await fetchMerchantScannerLaunchOptions(accessToken);
      if (!isMountedRef.current) return;
      setScannerDevices(Array.isArray(payload?.devices) ? payload.devices : []);
    } catch {
      if (!isMountedRef.current) return;
      setScannerError("We couldn’t check Scanner Mode right now.");
    } finally {
      if (isMountedRef.current) setIsScannerLoading(false);
    }
  }

  function refreshCurrentPageData({ showLoading = false } = {}) {
    const refreshers = {
      dashboard: refreshDashboardData,
      activity: refreshActivityHistory,
      customers: refreshCustomers,
      campaigns: refreshCampaigns,
    };
    return Promise.all(
      getMerchantPageDatasets(page).map((dataset) => refreshers[dataset]({ showLoading })),
    );
  }

  const onRefreshCurrentPageData = useEffectEvent(refreshCurrentPageData);
  const onRefreshCustomers = useEffectEvent(refreshCustomers);
  const onRefreshActivityHistory = useEffectEvent(refreshActivityHistory);
  const onRefreshScannerOptions = useEffectEvent(refreshScannerOptions);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedCustomerSearch(customerSearch), 300);
    return () => window.clearTimeout(timeoutId);
  }, [customerSearch]);

  useEffect(() => {
    isMountedRef.current = true;
    onRefreshCurrentPageData({ showLoading: true });
    return () => {
      isMountedRef.current = false;
    };
  }, [accessToken, page]);

  useEffect(() => {
    let isCancelled = false;
    Promise.resolve().then(() => {
      if (!isCancelled) onRefreshScannerOptions({ showLoading: true });
    });
    return () => { isCancelled = true; };
  }, [accessToken]);

  useEffect(() => {
    if (page !== "customers") return;
    let isCancelled = false;
    Promise.resolve().then(() => {
      if (!isCancelled) onRefreshCustomers({ showLoading: true });
    });
    return () => {
      isCancelled = true;
    };
  }, [accessToken, debouncedCustomerSearch, effectiveCustomerStatus, customerPagination.page, page]);

  useEffect(() => {
    if (page !== "activity") return;
    let isCancelled = false;
    Promise.resolve().then(() => {
      if (!isCancelled) onRefreshActivityHistory({ showLoading: true });
    });
    return () => { isCancelled = true; };
  }, [accessToken, activityPeriod, activityPagination.page, page]);

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

  const currentPageHasError = page === "overview"
    ? Boolean(activityError || dashboardSummaryError || reminderError)
    : page === "customers"
      ? Boolean(customerError)
      : page === "activity"
        ? Boolean(activityHistoryError)
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
      await Promise.all([
        refreshCurrentPageData({ showLoading: false }),
        refreshScannerOptions({ showLoading: false }),
      ]);
      setManualRefreshState("done");
    } catch {
      setManualRefreshState("failed");
    }

    window.setTimeout(() => setManualRefreshState("idle"), 1600);
  }

  async function handleLaunchScanner(deviceId) {
    const scannerWindow = window.open("about:blank", "_blank");
    if (scannerWindow) scannerWindow.opener = null;
    setScannerError("");
    try {
      const payload = await createMerchantScannerLaunch(accessToken, deviceId);
      if (!payload?.launchUrl) throw new Error("Scanner launch URL missing");
      if (scannerWindow) scannerWindow.location.replace(payload.launchUrl);
      else window.location.assign(payload.launchUrl);
    } catch {
      if (scannerWindow) scannerWindow.close();
      setScannerError("Scanner Mode couldn’t be opened. Please try again.");
    }
  }

  function handleCustomerSearchChange(nextSearch) {
    setCustomerSearch(nextSearch);
    setCustomerPagination((current) => ({ ...current, page: 1 }));
    setExpandedCustomerId(null);
  }

  function handleCustomerStatusChange(nextStatus) {
    setCustomerStatus(nextStatus);
    setCustomerPagination((current) => ({ ...current, page: 1 }));
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
      scannerDevices={scannerDevices}
      isScannerLoading={isScannerLoading}
      scannerError={scannerError}
      onLaunchScanner={handleLaunchScanner}
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
          pagination={customerPagination}
          onPageChange={(nextPage) => {
            setExpandedCustomerId(null);
            setCustomerPagination((current) => ({ ...current, page: nextPage }));
          }}
          expandedCustomerId={expandedCustomerId}
          onExpandedCustomerChange={setExpandedCustomerId}
          birthdayRewardsEnabled={birthdayRewardsEnabled}
        />
      ) : null}

      {page === "activity" ? (
          <MerchantActivity
            activityRows={activityHistoryRows}
            isLoading={isActivityHistoryLoading}
            error={activityHistoryError}
            birthdayRewardsEnabled={birthdayRewardsEnabled}
            period={activityPeriod}
            onPeriodChange={(nextPeriod) => {
              setActivityPeriod(nextPeriod);
              setActivityPagination((current) => ({ ...current, page: 1 }));
            }}
            pagination={activityPagination}
            onPageChange={(nextPage) => setActivityPagination((current) => ({ ...current, page: nextPage }))}
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
