import PricingPage from "./marketing/PricingPage.jsx";
import { Component, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import MarketingHomepage from "./marketing/MarketingHomepage.jsx";
import AdminPortal, { AdminSetPasswordPage } from "./AdminPortal.jsx";
import MerchantPortalShell from "./merchant/MerchantPortal.jsx";
import MerchantSetup from "./merchant/MerchantSetup.jsx";
import MerchantForgotPassword from "./merchant/MerchantForgotPassword.jsx";
import MerchantResetPassword from "./merchant/MerchantResetPassword.jsx";
import MerchantDashboard from "./merchant/MerchantDashboard.jsx";
import MerchantDashboardDemo from "./merchant/MerchantDashboardDemo.jsx";
import {
  isMerchantScannerPath,
  isMerchantSetupPath,
  isMerchantForgotPasswordPath,
  isMerchantResetPasswordPath,
  resolveMerchantManagementPage,
} from "./merchant/merchantRoutes.js";
import { SALES_EMAIL, SUPPORT_EMAIL } from "./contactEmails.js";
import "./App.css";
import {
  createOptimisticScannerActivity,
  formatScannerActivityTime,
  getQuickExtraStampTarget,
  getScannerActivityFirstName,
  getScannerActivitySummary,
  normalizeScannerActivities,
  prependScannerActivity,
} from "./scannerActivity";
import {
  createScannerMutationActionController,
} from "./merchant/requestIds.js";
import {
  buildScannerAdjustmentRequest,
  buildScannerLookupRequest,
  buildScannerRedemptionRequest,
  buildScannerScanRequest,
  buildScannerUndoRequest,
  getScannerLookupIdentifier,
} from "./merchant/scannerRequests.js";
import {
  applyManualPaste,
  getSuccessfulCustomerPass,
  normalizeManualScanValue,
  sanitizeScannerMessage,
} from "./merchant/scannerManualEntry.js";

const TOKEN_STORAGE_KEY = "pocketstampMerchantAccessToken";
const MERCHANT_DATA_CHANGED_EVENT = "pocketstamp:merchant-data-changed";
const MERCHANT_DATA_CHANGED_STORAGE_KEY = "pocketstampMerchantDataChangedAt";

const demoJoinUrl = "/join/pocket-stamp-demo";
const demoSuccessUrl = "/join/pocket-stamp-demo/success";
const demoCreateCardUrl = "/demo/pocket-stamp-demo/create";
const contactUrl = "/contact";
const privacyPolicyUrl = "/legal/privacy";
const loyaltyTermsUrl = "/legal/terms";
const demoPassStorageKey = "pocketstampDemoPassUrl";
const demoMerchantName = "PocketStamp Demo";
const consentVersions = {
  privacyNoticeVersion: "privacy_notice_v1_2026_07",
  loyaltyTermsVersion: "loyalty_terms_v1_2026_07",
  marketingConsentTextVersion: "marketing_consent_v1_2026_07",
};

function getLoyaltyTermsSections(cafeName = "this café") {
  return [
    {
      body: `These Loyalty Terms apply when you create and use a digital loyalty card for ${cafeName} through PocketStamp.`,
    },
    {
      title: "1. How the loyalty card works",
      body: `Your loyalty card lets you collect stamps or rewards when you make eligible purchases at ${cafeName}. The reward shown on the join page or Wallet card explains the current reward offer.`,
    },
    {
      title: "2. Earning stamps",
      body: `Stamps are added by ${cafeName} staff or approved scanning tools. Stamps may only be added for genuine eligible purchases. ${cafeName} may refuse, remove, or correct stamps if there has been a mistake, misuse, suspected fraud, or abuse of the loyalty programme.`,
    },
    {
      title: "3. Redeeming rewards",
      body: `When you have collected enough stamps for a reward, ${cafeName} may mark the reward as redeemed. Rewards have no cash value, cannot be exchanged for cash, and are not transferable unless ${cafeName} agrees.`,
    },
    {
      title: "4. Changes to the programme",
      body: `${cafeName} may change, pause, or end its loyalty programme, reward offer, or eligibility rules at any time. Where reasonable, existing customers will be given notice through the café, email, Apple Wallet updates, or other available channels.`,
    },
    {
      title: "5. Your Wallet card",
      body: "Your loyalty card is provided through Apple Wallet. You are responsible for keeping access to your device and Wallet secure. Apple is not responsible for this loyalty programme, stamps, rewards, or customer support.",
    },
    {
      title: "6. Contact",
      body: `Questions about stamps, rewards, or the loyalty programme should be directed to ${cafeName}. Questions about the PocketStamp technology can be sent to ${SUPPORT_EMAIL}.`,
    },
  ];
}

function getPrivacyNoticeSections(cafeName = "this café") {
  return [
    {
      body: `This Privacy Notice explains how your information is used when you create and use a digital loyalty card for ${cafeName} through PocketStamp.`,
    },
    {
      title: "1. Who is responsible for your data",
      body: `${cafeName} is responsible for how your loyalty customer information is used for its café loyalty programme. PocketStamp provides the technology used to create and manage the Apple Wallet loyalty card.`,
    },
    {
      title: "2. Information we collect",
      body: "When you create or use a loyalty card, the following information may be collected:",
      items: [
        "your name;",
        "your email address;",
        "your optional birthday month and day;",
        "your Wallet loyalty card identifier;",
        "stamp, reward, redemption, and activity history;",
        "consent records, such as when you accepted these terms or opted into marketing.",
      ],
    },
    {
      title: "3. How your information is used",
      body: "Your information is used to:",
      items: [
        "create and manage your Apple Wallet loyalty card;",
        "add stamps and redeem rewards;",
        "provide birthday rewards if you choose to add your birthday;",
        "prevent misuse or fraud;",
        "send service messages about your loyalty card;",
        "send offers, rewards, and updates only where you have opted in or where otherwise permitted by law.",
      ],
    },
    {
      title: "4. Marketing consent",
      body: `Marketing is optional. You can create a loyalty card without agreeing to receive marketing. If you opt in, ${cafeName} may send you offers, rewards, and updates by email and Apple Wallet notifications. You can unsubscribe or withdraw consent at any time.`,
    },
    {
      title: "5. Sharing your information",
      body: "Your information may be processed by PocketStamp and trusted service providers that help operate the loyalty card, database, hosting, email, and Wallet pass services. Your information is not sold.",
    },
    {
      title: "6. How long information is kept",
      body: "Your information is kept for as long as needed to operate the loyalty programme, meet legal obligations, resolve disputes, prevent misuse, and keep accurate consent records. If you ask for deletion, your information will be deleted or anonymised unless it needs to be kept for legal or legitimate business reasons.",
    },
    {
      title: "7. Your rights",
      body: "You may ask to access, correct, delete, or restrict the use of your personal information. You may also object to certain uses or withdraw consent where processing is based on consent.",
    },
    {
      title: "8. Contact",
      body: `To ask a privacy question, request deletion, or withdraw marketing consent, contact ${cafeName} or email ${SUPPORT_EMAIL}.`,
    },
  ];
}

const SCANNER_API_BASE_URL = "";

async function scannerRequestJson(path, options = {}) {
  const response = await fetch(`${SCANNER_API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(payload?.message || "Could not connect to this scanner device.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function exchangeScannerLaunch(launchCredential) {
  return scannerRequestJson("/api/merchant/scanner/launch-sessions/exchange", {
    method: "POST",
    body: JSON.stringify({ launchCredential }),
  });
}

async function fetchScannerDevice(deviceToken) {
  const tokenQuery = deviceToken ? `?deviceToken=${encodeURIComponent(deviceToken)}` : "";
  const requestUrl = `${SCANNER_API_BASE_URL}/api/merchant/scanner/device${tokenQuery}`;
  const response = await fetch(requestUrl, {
    method: "GET",
    credentials: "include",
  });

  const text = await response.text();
  let payload;

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

function fetchScannerActivity(deviceToken) {
  const tokenQuery = deviceToken ? `?deviceToken=${encodeURIComponent(deviceToken)}` : "";
  return scannerRequestJson(`/api/merchant/scanner/activity${tokenQuery}`);
}

function submitScannerScan({ deviceToken, scanValue, requestId }) {
  return scannerRequestJson("/api/merchant/scanner/scan", {
    method: "POST",
    body: JSON.stringify(buildScannerScanRequest({ deviceToken, scanValue, requestId })),
  });
}

function lookupScannerPass({ deviceToken, scanValue, scanResult }) {
  return scannerRequestJson("/api/merchant/scanner/lookup-pass", {
    method: "POST",
    body: JSON.stringify(buildScannerLookupRequest({
      deviceToken,
      scanValue,
      pass: buildScannerPassBody(scanResult),
    })),
  });
}

function adjustScannerStamps({ deviceToken, scanResult, stamps, note, requestId }) {
  return scannerRequestJson("/api/merchant/scanner/adjust-stamps", {
    method: "POST",
    body: JSON.stringify(buildScannerAdjustmentRequest({
      deviceToken,
      stamps,
      note,
      requestId,
      pass: buildScannerPassBody(scanResult),
    })),
  });
}

function redeemScannerReward({ deviceToken, scanResult, requestId }) {
  return scannerRequestJson("/api/merchant/scanner/redeem", {
    method: "POST",
    body: JSON.stringify(buildScannerRedemptionRequest({
      action: buildScannerActionBody(deviceToken, scanResult),
      requestId,
    })),
  });
}

function undoScannerStamp({ deviceToken, scanResult }) {
  return scannerRequestJson("/api/merchant/scanner/undo", {
    method: "POST",
    body: JSON.stringify(buildScannerUndoRequest({
      action: buildScannerActionBody(deviceToken, scanResult),
    })),
  });
}

function notifyMerchantDataChanged(detail = {}) {
  if (typeof window === "undefined") return;
  const payload = {
    changedAt: Date.now(),
    ...detail,
  };

  window.dispatchEvent(new CustomEvent(MERCHANT_DATA_CHANGED_EVENT, { detail: payload }));

  try {
    window.localStorage.setItem(MERCHANT_DATA_CHANGED_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Same-tab custom events still cover the common case when storage is unavailable.
  }
}

function toTitle(value) {
  if (!value) return "Activity";
  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function buildScannerPassBody(scanResult = {}) {
  const scan = scanResult || {};
  const customerId = pickFirst(
    scan.customerId,
    scan.customer_id,
    scan.passCustomerId,
    scan.customer?.id,
    scan.id,
    scan.result?.customerId,
    scan.result?.customer_id,
    scan.result?.customer?.id,
    scan.data?.customerId,
    scan.data?.customer_id,
    scan.data?.customer?.id,
  );
  const passId = pickFirst(
    scan.passId,
    scan.walletPassId,
    scan.pass?.id,
    scan.result?.passId,
    scan.result?.pass?.id,
    scan.data?.passId,
    scan.data?.pass?.id,
  );
  const serialNumber = pickFirst(
    scan.passSerial,
    scan.pass_serial,
    scan.serialNumber,
    scan.serial_number,
    scan.passSerialNumber,
    scan.pass?.serial_number,
    scan.pass?.serialNumber,
    scan.result?.passSerial,
    scan.result?.pass_serial,
    scan.result?.serialNumber,
    scan.result?.serial_number,
    scan.result?.pass?.serial_number,
    scan.result?.pass?.serialNumber,
    scan.data?.passSerial,
    scan.data?.pass_serial,
    scan.data?.serialNumber,
    scan.data?.serial_number,
    scan.data?.pass?.serial_number,
    scan.data?.pass?.serialNumber,
  );

  return {
    ...(customerId ? { customerId } : {}),
    ...(passId ? { passId } : {}),
    ...(serialNumber ? { serialNumber, passSerial: serialNumber, passSerialNumber: serialNumber } : {}),
  };
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [legalModal, setLegalModal] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isFormValid = Boolean(fullName.trim() && emailIsValid && termsAccepted);

  function openLegalModal(event, type) {
    event.preventDefault();
    event.stopPropagation();
    setLegalModal(type);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your name to create your loyalty card.");
      return;
    }

    if (!emailIsValid) {
      setError("Please enter a valid email address to create your loyalty card.");
      return;
    }

    if (!termsAccepted) {
      setError("Please agree to the Loyalty Terms and acknowledge the Privacy Notice to create your loyalty card.");
      return;
    }

    setIsSubmitting(true);

    const params = new URLSearchParams();

    if (fullName.trim()) params.set("name", fullName.trim());
    if (email.trim()) params.set("email", email.trim());
    params.set("birthdayMonth", "");
    params.set("birthdayDay", "");
    params.set("termsAccepted", termsAccepted ? "true" : "false");
    params.set("marketingOptIn", marketingOptIn ? "true" : "false");
    params.set("privacyNoticeVersion", consentVersions.privacyNoticeVersion);
    params.set("loyaltyTermsVersion", consentVersions.loyaltyTermsVersion);
    params.set("marketingConsentTextVersion", consentVersions.marketingConsentTextVersion);

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

            <div className="ps-consent-section">
              <p className="ps-consent-helper">
                We use your details to create and manage your Apple Wallet loyalty card for this café.
              </p>

              <label className="ps-consent-option">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  required
                />
                <span>
                  I agree to the{" "}
                  <button
                    type="button"
                    className="ps-inline-link"
                    onClick={(event) => openLegalModal(event, "terms")}
                  >
                    Loyalty Terms
                  </button>{" "}
                  and acknowledge the{" "}
                  <button
                    type="button"
                    className="ps-inline-link"
                    onClick={(event) => openLegalModal(event, "privacy")}
                  >
                    Privacy Notice
                  </button>
                  .
                </span>
              </label>

              <label className="ps-consent-option">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                />
                <span>
                  I’d like to receive offers, rewards, and updates from this café by email and Apple Wallet notifications. I can unsubscribe at any time.
                </span>
              </label>
            </div>

            {error ? (
              <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={isSubmitting || !isFormValid} className="ps-button-primary w-full">
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

      <LegalNoticeModal
        cafeName={demoMerchantName}
        type={legalModal}
        onClose={() => setLegalModal("")}
      />
    </main>
  );
}

function LegalNoticeModal({ cafeName = "this café", type, onClose }) {
  useEffect(() => {
    if (!type) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, type]);

  if (!type) return null;

  const isTerms = type === "terms";
  const title = isTerms ? "Loyalty Terms" : "Privacy Notice";
  const titleId = isTerms ? "loyaltyTermsTitle" : "privacyNoticeTitle";
  const sections = isTerms
    ? getLoyaltyTermsSections(cafeName)
    : getPrivacyNoticeSections(cafeName);

  return (
    <div className="ps-legal-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ps-legal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ps-legal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p className="ps-legal-version">
              Version: {consentVersions.privacyNoticeVersion} and{" "}
              {consentVersions.loyaltyTermsVersion}
            </p>
          </div>
          <button
            type="button"
            className="ps-legal-close"
            onClick={onClose}
            aria-label="Close legal text"
          >
            ×
          </button>
        </div>
        <div className="ps-legal-body">
          {sections.map((section) => (
            <section key={section.title || section.body}>
              {section.title ? <h3>{section.title}</h3> : null}
              <p>{section.body}</p>
              {section.items ? (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
        <div className="ps-legal-footer">
          <p>Please read these terms before creating your loyalty card.</p>
          <button type="button" className="ps-legal-done" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
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
                ? `${customerName ? `${customerName}, use the button below` : "Use the button below"} to open Apple Wallet and add your card.`
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

function SiteFooter() {
  return (
    <footer className="ps-footer">
      <div className="ps-section-shell">
        <p>© {new Date().getFullYear()} PocketStamp.</p>
        <div>
          <a href={contactUrl}>Contact</a>
          <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a>
          <a href={demoJoinUrl}>Try the PocketStamp demo card</a>
          <a href="/download">PocketStamp Scanner · Android Download</a>
        </div>
      </div>
    </footer>
  );
}

function usePageMetadata({ title, description, canonicalUrl }) {
  useLayoutEffect(() => {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
  }, [canonicalUrl, description, title]);
}

function PublicLegalPage({ type }) {
  const isTerms = type === "terms";
  const title = isTerms ? "Loyalty Terms" : "Privacy Policy";
  const description = isTerms
    ? "Read the PocketStamp loyalty card terms."
    : "Read the PocketStamp privacy policy for digital loyalty cards.";
  const canonicalPath = isTerms ? loyaltyTermsUrl : privacyPolicyUrl;
  const sections = isTerms
    ? getLoyaltyTermsSections("your café")
    : getPrivacyNoticeSections("your café");

  usePageMetadata({
    title: `${title} | PocketStamp`,
    description,
    canonicalUrl: `https://www.getpocketstamp.com${canonicalPath}`,
  });

  return (
    <main className="ps-site ps-contact min-h-screen">
      <header className="ps-site-header">
        <nav className="ps-nav-shell" aria-label="Primary navigation">
          <a href="/" className="ps-wordmark" aria-label="PocketStamp home">
            <span className="ps-logo-mark" aria-hidden="true">P</span>
            <span>PocketStamp</span>
          </a>
          <a href={contactUrl} className="ps-nav-link">Contact</a>
        </nav>
      </header>

      <article className="ps-contact-shell ps-public-legal">
        <p className="ps-eyebrow">Legal</p>
        <h1 className="ps-display">{title}</h1>
        <p className="ps-public-legal-version">
          Version: {isTerms ? consentVersions.loyaltyTermsVersion : consentVersions.privacyNoticeVersion}
        </p>
        <div className="ps-public-legal-sections">
          {sections.map((section) => (
            <section key={section.title || section.body}>
              {section.title ? <h2 className="ps-display">{section.title}</h2> : null}
              <p>{section.body}</p>
              {section.items ? (
                <ul>
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}

function ContactPage() {
  usePageMetadata({
    title: "Contact PocketStamp | Customer Support",
    description: "Contact PocketStamp for customer support, loyalty card help, or business enquiries.",
    canonicalUrl: "https://www.getpocketstamp.com/contact",
  });

  return (
    <main className="ps-site ps-contact min-h-screen">
      <header className="ps-site-header">
        <nav className="ps-nav-shell" aria-label="Primary navigation">
          <a href="/" className="ps-wordmark" aria-label="PocketStamp home">
            <span className="ps-logo-mark" aria-hidden="true">P</span>
            <span>PocketStamp</span>
          </a>
          <a href="/" className="ps-nav-link">Home</a>
        </nav>
      </header>

      <div className="ps-contact-shell">
        <section className="ps-contact-intro" aria-labelledby="contact-title">
          <p className="ps-eyebrow">Support</p>
          <h1 id="contact-title" className="ps-display">Contact PocketStamp</h1>
          <p>
            Need help with PocketStamp, your loyalty card, or setting up PocketStamp for your business?
            Get in touch and we’ll be happy to help.
          </p>
        </section>

        <div className="ps-contact-grid">
          <section className="ps-contact-card">
            <h2 className="ps-display">Customer support</h2>
            <p>
              For questions about your PocketStamp loyalty card, account, or anything not working as
              expected, email our support team.
            </p>
            <a href={`mailto:${SUPPORT_EMAIL}`}>Email customer support at {SUPPORT_EMAIL}</a>
            <p className="ps-contact-note">We aim to respond within one business day.</p>
          </section>

          <section className="ps-contact-card">
            <h2 className="ps-display">Business enquiries</h2>
            <p>
              Interested in offering PocketStamp at your café or business? Contact us to arrange a
              demonstration or discuss how PocketStamp could work for you.
            </p>
            <a href={`mailto:${SUPPORT_EMAIL}`}>Email PocketStamp business enquiries at {SUPPORT_EMAIL}</a>
          </section>
        </div>

        <nav className="ps-contact-links" aria-label="Useful links">
          <h2 className="ps-display">Useful links</h2>
          <div>
            <a href={privacyPolicyUrl}>Privacy Policy</a>
            <a href={loyaltyTermsUrl}>Loyalty Terms</a>
            <a href="/">Home</a>
          </div>
        </nav>
      </div>

      <SiteFooter />
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

function ScannerDownloadPage() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const apkPath = "/downloads/PocketStamp-Scanner-v1.1.1.apk";

  usePageMetadata({
    title: "PocketStamp Scanner for Android | PocketStamp",
    description: "Download PocketStamp Scanner for compatible Android POS tablets and set up Wallet loyalty for your café.",
    canonicalUrl: "https://www.getpocketstamp.com/download",
  });

  return (
    <main className="ps-site ps-download-page">
      <header className="ps-download-header">
        <a href="/" className="ps-wordmark" aria-label="PocketStamp home">
          <span className="ps-logo-mark" aria-hidden="true">P</span>
          <span>PocketStamp</span>
        </a>
      </header>

      <section className="ps-download-panel" aria-labelledby="download-title">
        <div className="ps-download-icon" aria-hidden="true">↓</div>
        <p className="ps-eyebrow">PocketStamp Scanner · Android</p>
        <h1 id="download-title" className="ps-display">PocketStamp Scanner</h1>
        <p className="ps-download-intro">
          Download PocketStamp Scanner, then open the app and enter the setup code from your PocketStamp merchant dashboard.
        </p>
        <a className="ps-download-button" href={apkPath} download="PocketStamp-Scanner-v1.1.1.apk">
          Download PocketStamp Scanner
        </a>
        <p className="ps-download-meta">Version 1.1.1 <span aria-hidden="true">·</span> Android</p>
        {!isAndroid ? (
          <p className="ps-download-compatibility">
            PocketStamp Scanner is designed for compatible Android POS tablets. We’ll confirm compatibility as part of setup.
          </p>
        ) : null}
        <p className="ps-download-support">
          After installing, open PocketStamp Scanner and enter the setup code provided from your PocketStamp merchant dashboard.
        </p>
        <a href="/" className="ps-download-back">← Back to PocketStamp</a>
      </section>
    </main>
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

function normalizeScannerScanValue(value) {
  return normalizeManualScanValue(value);
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
    scan.result?.customerName,
    scan.result?.customer?.name,
    scan.data?.customerName,
    scan.data?.customer?.name,
  );
}

function getScanCustomerEmail(result = {}) {
  const scan = result || {};
  return pickFirst(
    scan.customerEmail,
    scan.email,
    scan.customer?.email,
    scan.pass?.customerEmail,
    scan.pass?.email,
    scan.result?.customerEmail,
    scan.result?.customer?.email,
    scan.data?.customerEmail,
    scan.data?.customer?.email,
  );
}

function getScanCurrentStamps(result = {}) {
  const scan = result || {};
  return pickFirst(
    scan.currentStamps,
    scan.stamps,
    scan.stampCount,
    scan.customer?.currentStamps,
    scan.customer?.stamps,
    scan.pass?.currentStamps,
    scan.pass?.stamps,
    scan.result?.currentStamps,
    scan.result?.stamps,
    scan.result?.stampCount,
    scan.result?.customer?.currentStamps,
    scan.data?.currentStamps,
    scan.data?.stamps,
    scan.data?.stampCount,
    scan.data?.customer?.currentStamps,
  );
}

function getScanRewardThreshold(result = {}) {
  const scan = result || {};
  return pickFirst(
    scan.rewardThreshold,
    scan.threshold,
    scan.customer?.rewardThreshold,
    scan.customer?.threshold,
    scan.pass?.rewardThreshold,
    scan.pass?.threshold,
    scan.result?.rewardThreshold,
    scan.result?.threshold,
    scan.result?.customer?.rewardThreshold,
    scan.data?.rewardThreshold,
    scan.data?.threshold,
    scan.data?.customer?.rewardThreshold,
  );
}

function getScanStamps(result = {}) {
  const current = getScanCurrentStamps(result);
  const threshold = getScanRewardThreshold(result);

  if (current === undefined && threshold === undefined) return "";
  return `${current ?? "?"}/${threshold ?? "?"}`;
}

function getScanPassSerial(result = {}) {
  const scan = result || {};
  return pickFirst(
    scan.passSerial,
    scan.pass_serial,
    scan.serialNumber,
    scan.serial_number,
    scan.passSerialNumber,
    scan.pass?.serial_number,
    scan.pass?.serialNumber,
    scan.result?.passSerial,
    scan.result?.pass_serial,
    scan.result?.serialNumber,
    scan.result?.serial_number,
    scan.result?.pass?.serial_number,
    scan.result?.pass?.serialNumber,
    scan.data?.passSerial,
    scan.data?.pass_serial,
    scan.data?.serialNumber,
    scan.data?.serial_number,
    scan.data?.pass?.serial_number,
    scan.data?.pass?.serialNumber,
  );
}

function getScanCustomerId(result = {}) {
  const scan = result || {};
  return pickFirst(
    scan.customerId,
    scan.customer_id,
    scan.passCustomerId,
    scan.customer?.id,
    scan.id,
    scan.result?.customerId,
    scan.result?.customer_id,
    scan.result?.customer?.id,
    scan.result?.id,
    scan.data?.customerId,
    scan.data?.customer_id,
    scan.data?.customer?.id,
    scan.data?.id,
  );
}

function getScanLastActivity(result = {}) {
  const scan = result || {};
  return pickFirst(
    scan.lastActivityAt,
    scan.lastScanAt,
    scan.lastScannedAt,
    scan.customer?.lastActivityAt,
    scan.customer?.lastScanAt,
    scan.pass?.lastActivityAt,
    scan.result?.lastActivityAt,
    scan.result?.customer?.lastActivityAt,
    scan.data?.lastActivityAt,
    scan.data?.customer?.lastActivityAt,
  );
}

function maskScannerId(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= 10) return text;
  return `${text.slice(0, 5)}...${text.slice(-4)}`;
}

function formatScannerDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function cameraContextAllowsScanning() {
  const hostname = window.location.hostname;
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  return window.location.protocol === "https:" || isLocalhost;
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
  return sanitizeScannerMessage(pickFirst(
    errorOrPayload?.message,
    errorOrPayload?.error,
    errorOrPayload?.details,
    errorOrPayload?.payload?.message,
    errorOrPayload?.payload?.error,
    "Please try again.",
  ));
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

function CameraScannerModal({ isOpen, isProcessing, onClose, onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const zxingControlsRef = useRef(null);
  const frameRef = useRef(null);
  const closingRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  const [cameraStatus, setCameraStatus] = useState("starting");
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  function stopCamera() {
    closingRef.current = true;
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    zxingControlsRef.current?.stop?.();
    zxingControlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => {
    if (!isOpen) return undefined;

    closingRef.current = false;
    function handleDetected(qrValue) {
      if (!qrValue || closingRef.current) return;
      setCameraStatus("detected");
      stopCamera();
      onDetectedRef.current(qrValue);
    }

    async function startNativeBarcodeDetector() {
      if (!("BarcodeDetector" in window)) return false;

      const supportedFormats = await window.BarcodeDetector.getSupportedFormats?.();
      if (Array.isArray(supportedFormats) && !supportedFormats.includes("qr_code")) return false;

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      if (closingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStatus("scanning");

      const scanFrame = async () => {
        if (closingRef.current || !videoRef.current) return;

        try {
          const codes = await detector.detect(videoRef.current);
          const qrValue = codes?.find((code) => code.rawValue)?.rawValue;
          if (qrValue) {
            handleDetected(qrValue);
            return;
          }
        } catch (scanError) {
          console.warn("Camera QR scan failed", scanError);
        }

        frameRef.current = window.requestAnimationFrame(scanFrame);
      };

      frameRef.current = window.requestAnimationFrame(scanFrame);
      return true;
    }

    async function startZxingScanner() {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const codeReader = new BrowserQRCodeReader();
      const controls = await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error, controlsFromCallback) => {
          if (closingRef.current) return;
          if (controlsFromCallback && !zxingControlsRef.current) {
            zxingControlsRef.current = controlsFromCallback;
          }
          const qrValue = result?.getText?.();
          if (qrValue) handleDetected(qrValue);
          if (error && error.name && !/NotFoundException/i.test(error.name)) {
            console.warn("ZXing QR scan failed", error);
          }
        },
      );

      zxingControlsRef.current = controls;
      const stream = videoRef.current?.srcObject;
      if (stream?.getTracks) streamRef.current = stream;
      setCameraStatus("scanning");
    }

    async function startCamera() {
      if (!cameraContextAllowsScanning()) {
        setCameraStatus("unsupported");
        setCameraError("Camera scanning needs HTTPS. Use the counter scanner or manual code instead.");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("unsupported");
        setCameraError("Camera scanning is not available on this tablet. Use the counter scanner or manual code instead.");
        return;
      }

      try {
        const nativeStarted = await startNativeBarcodeDetector();
        if (!nativeStarted && !closingRef.current) await startZxingScanner();
      } catch (error) {
        console.warn("Camera unavailable", error);
        setCameraStatus("error");
        setCameraError(
          /permission|denied|notallowed/i.test(String(error?.name || error?.message || ""))
            ? "Camera unavailable / permission denied"
            : "Camera unavailable / permission denied",
        );
        stopCamera();
      }
    }

    startCamera();

    return stopCamera;
  }, [isOpen]);

  if (!isOpen) return null;

  const statusText =
    cameraStatus === "starting"
      ? "Starting camera..."
      : cameraStatus === "detected"
        ? "QR detected, processing..."
        : cameraStatus === "unsupported" || cameraStatus === "error"
          ? cameraError || "Camera unavailable / permission denied"
          : "Point camera at the customer’s Apple Wallet QR code";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-6">
      <section className="w-full max-w-2xl rounded-3xl bg-[#fffdf8] p-5 text-[var(--ps-espresso)] shadow-[var(--ps-shadow)] ring-1 ring-[var(--ps-border)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-[var(--ps-muted)]">Tablet camera</p>
            <h2 className="mt-1 text-2xl font-semibold">Scan with tablet camera</h2>
          </div>
          <button type="button" onClick={onClose} className="ps-button-secondary bg-white">
            Stop camera
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl bg-black ring-1 ring-[var(--ps-border)]">
          <video
            ref={videoRef}
            muted
            playsInline
            className={`aspect-[4/3] w-full object-cover ${cameraStatus === "scanning" ? "block" : "hidden"}`}
          />
          {cameraStatus !== "scanning" ? (
            <div className="grid aspect-[4/3] place-items-center bg-[#f6efe3] p-6 text-center">
              <p className="text-xl font-bold">{statusText}</p>
            </div>
          ) : null}
        </div>

        {cameraStatus === "scanning" ? (
          <p className="mt-4 text-center text-lg font-semibold text-[var(--ps-muted)]">{statusText}</p>
        ) : null}
        {isProcessing || cameraStatus === "detected" ? (
          <p className="mt-3 rounded-xl bg-[#e7f7f3] p-3 text-center text-sm font-bold text-[#0f6f5f]">
            QR detected, processing...
          </p>
        ) : null}
      </section>
    </div>
  );
}

function CustomerAdjustmentModal({
  isOpen,
  customerResult,
  isLoading,
  isSaving,
  error,
  success,
  authoritativeStamps,
  isReady,
  fallbackThreshold,
  onChangeStamps,
  onChangeNote,
  onSave,
  onClose,
}) {
  const dialogRef = useRef(null);
  const currentStamps = Number(getScanCurrentStamps(customerResult) ?? 0);
  const threshold = Number(getScanRewardThreshold(customerResult) ?? fallbackThreshold ?? 10);
  const maxStamps = Number.isFinite(threshold) && threshold >= 0 ? threshold : 10;
  const passSerial = getScanPassSerial(customerResult);
  const customerId = getScanCustomerId(customerResult);
  const identifierValue = maskScannerId(passSerial || customerId);
  const lastActivity = formatScannerDateTime(getScanLastActivity(customerResult));

  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleEscape(event) {
      if (event.key === "Escape" && !isSaving) onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 py-6">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scanner-adjustment-title"
        tabIndex="-1"
        className="w-full max-w-lg rounded-3xl bg-[#fffdf8] p-5 text-[var(--ps-espresso)] shadow-[var(--ps-shadow)] ring-1 ring-[var(--ps-border)] outline-none"
      >
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--ps-muted)]">Customer correction</p>
        <h2 id="scanner-adjustment-title" className="mt-1 text-2xl font-semibold">
          {getScanCustomerName(customerResult) || "Customer"}
        </h2>
        {getScanCustomerEmail(customerResult) ? (
          <p className="mt-1 text-sm font-semibold text-[var(--ps-muted)]">{getScanCustomerEmail(customerResult)}</p>
        ) : null}

        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[var(--ps-border)]">
          <p className="text-sm font-bold uppercase text-[var(--ps-muted)]">Current balance</p>
          <p className="mt-1 text-xl font-semibold">
            {Number.isFinite(authoritativeStamps) ? `${authoritativeStamps} of ${maxStamps} stamps` : `${currentStamps} of ${maxStamps} stamps`}
          </p>
          {isLoading ? <p className="mt-1 text-sm font-semibold text-[var(--ps-muted)]">Refreshing current balance...</p> : null}
          {lastActivity ? <p className="mt-2 text-xs font-semibold text-[var(--ps-muted)]">Last activity {lastActivity}</p> : null}
          {identifierValue ? <p className="mt-1 text-xs text-[var(--ps-muted)]">Reference {identifierValue}</p> : null}
        </div>

        <form className="mt-4 grid gap-4" onSubmit={onSave}>
          <label className="block">
            <span className="text-sm font-bold text-[var(--ps-muted)]">Adjust stamp count</span>
            <div className="mt-2 grid grid-cols-[3.75rem_1fr_3.75rem] overflow-hidden rounded-2xl border border-[var(--ps-border)] bg-white">
              <button
                type="button"
                onClick={() => onChangeStamps(Math.max(0, currentStamps - 1))}
                disabled={isSaving || !isReady || currentStamps <= 0}
                aria-label="Remove one stamp"
                className="grid min-h-14 place-items-center border-r border-[var(--ps-border)] text-2xl font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={currentStamps}
                onChange={(event) => onChangeStamps(event.target.value)}
                aria-label="Adjusted stamp count"
                className="min-w-0 border-0 bg-white text-center text-2xl font-bold outline-none"
                disabled={isSaving || !isReady}
              />
              <button
                type="button"
                onClick={() => onChangeStamps(Math.min(maxStamps, currentStamps + 1))}
                disabled={isSaving || !isReady || currentStamps >= maxStamps}
                aria-label="Add one stamp"
                className="grid min-h-14 place-items-center border-l border-[var(--ps-border)] text-2xl font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-[var(--ps-muted)]">Optional note</span>
            <input
              onChange={(event) => onChangeNote(event.target.value)}
              className="ps-input mt-2 bg-white"
              placeholder="Optional"
              disabled={isSaving || !isReady}
            />
          </label>

          <p className="text-sm font-semibold text-[var(--ps-muted)]">Manual changes are logged.</p>

          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800 ring-1 ring-red-200">{error}</p> : null}
          {success ? <p className="rounded-xl bg-[#e7f7f3] p-3 text-sm font-bold text-[#0f6f5f] ring-1 ring-emerald-200">{success}</p> : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="submit" disabled={isSaving || !isReady} className="ps-button-primary disabled:cursor-not-allowed disabled:opacity-60">
              Save adjustment
            </button>
            <button type="button" onClick={onClose} disabled={isSaving} className="ps-button-secondary bg-white disabled:cursor-not-allowed disabled:opacity-60">
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ScannerKioskPage() {
  const deviceToken = new URLSearchParams(window.location.search).get("deviceToken") || "";
  const [launchCredential] = useState(() => {
    const credential = new URLSearchParams(window.location.hash.slice(1)).get("launch") || "";
    if (credential) window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
    return credential;
  });
  const inputRef = useRef(null);
  const manualInputRef = useRef(null);
  const manualCodeRef = useRef("");
  const readyTimerRef = useRef(null);
  const adjustmentLookupSequenceRef = useRef(0);
  const scannerBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const bufferTimerRef = useRef(null);
  const scanActionControllerRef = useRef(null);
  const redemptionActionControllerRef = useRef(null);
  const adjustmentActionControllerRef = useRef(null);
  const quickAddActionControllerRef = useRef(null);
  const scannerCaptureEnabledRef = useRef(true);
  const fullscreenRequestRef = useRef(false);
  if (!scanActionControllerRef.current) {
    scanActionControllerRef.current = createScannerMutationActionController({ namespace: "scanner.scan" });
  }
  if (!redemptionActionControllerRef.current) {
    redemptionActionControllerRef.current = createScannerMutationActionController({ namespace: "scanner.redeem" });
  }
  if (!adjustmentActionControllerRef.current) {
    adjustmentActionControllerRef.current = createScannerMutationActionController({ namespace: "scanner.adjust" });
  }
  if (!quickAddActionControllerRef.current) {
    quickAddActionControllerRef.current = createScannerMutationActionController({ namespace: "scanner.adjust" });
  }
  const [device, setDevice] = useState(null);
  const [deviceError, setDeviceError] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [deviceLoadStatus, setDeviceLoadStatus] = useState("loading");
  const [scanStatus, setScanStatus] = useState("idle");
  const [scanResult, setScanResult] = useState(null);
  const [readyMessage, setReadyMessage] = useState("");
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoadStatus, setActivityLoadStatus] = useState("loading");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [quickAddActivityId, setQuickAddActivityId] = useState("");
  const [quickAddError, setQuickAddError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(
    document.fullscreenElement ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone,
  ));
  const [adjustment, setAdjustment] = useState({
    isOpen: false,
    result: null,
    isLoading: false,
    isReady: false,
    isSaving: false,
    error: "",
    success: "",
    note: "",
    authoritativeStamps: null,
  });

  const merchantName = getScannerMerchantName(device || {});
  const deviceName = getScannerDeviceName(device || {});
  const scannerDeviceStatus = pickFirst(device?.status, device?.state);
  const mode = pickFirst(device?.mode, device?.scannerMode);
  const cooldown = pickFirst(device?.cooldownSeconds, device?.stampCooldownSeconds);
  const rewardThreshold = pickFirst(device?.rewardThreshold, device?.threshold);
  const scannerBranding = getScannerBranding(device || {});
  const rewardDecisionPending = scanStatus === "reward_ready";
  scannerCaptureEnabledRef.current = !isCameraOpen && !isManualOpen && !adjustment.isOpen;

  function focusScannerInput() {
    window.setTimeout(() => {
      if (!scannerCaptureEnabledRef.current) return;
      inputRef.current?.focus({ preventScroll: true });
      if (navigator.virtualKeyboard?.hide) {
        try {
          navigator.virtualKeyboard.hide();
        } catch (error) {
          void error;
        }
      }
    }, 40);
  }

  function enterScannerFullscreen() {
    if (document.fullscreenElement || fullscreenRequestRef.current || !document.documentElement.requestFullscreen) return;
    fullscreenRequestRef.current = true;
    Promise.resolve(document.documentElement.requestFullscreen({ navigationUI: "hide" }))
      .catch(() => document.documentElement.requestFullscreen?.())
      .catch(() => {})
      .finally(() => { fullscreenRequestRef.current = false; });
  }

  function clearGlobalScannerBuffer() {
    scannerBufferRef.current = "";
    lastKeyTimeRef.current = 0;
    window.clearTimeout(bufferTimerRef.current);
  }

  function updateManualCode(value) {
    manualCodeRef.current = value;
    setManualCode(value);
  }

  function clearManualAndScannerState() {
    updateManualCode("");
    setScanValue("");
    clearGlobalScannerBuffer();
  }

  function readCurrentManualValue() {
    const currentValue = manualInputRef.current?.value ?? manualCodeRef.current;
    updateManualCode(currentValue);
    return normalizeScannerScanValue(currentValue);
  }

  function scheduleReady(delay = 3600) {
    window.clearTimeout(readyTimerRef.current);
    readyTimerRef.current = window.setTimeout(() => {
      setScanStatus("idle");
      setScanResult(null);
      clearManualAndScannerState();
      setReadyMessage("");
      focusScannerInput();
    }, delay);
  }

  function clearPendingActionRequests() {
    scanActionControllerRef.current.clear();
    redemptionActionControllerRef.current.clear();
    adjustmentActionControllerRef.current.clear();
    quickAddActionControllerRef.current.clear();
  }

  function closeCamera() {
    scanActionControllerRef.current.clear();
    setIsCameraOpen(false);
    setScanStatus("idle");
    setScanResult(null);
    setReadyMessage("");
    clearManualAndScannerState();
    focusScannerInput();
  }

  async function loadDevice() {
    clearManualAndScannerState();
    setQuickAddError("");
    setDeviceLoadStatus("loading");
    setActivityLoadStatus("loading");
    setScanStatus("idle");
    setDeviceError("");

    try {
      if (launchCredential) await exchangeScannerLaunch(launchCredential);
      const payload = await fetchScannerDevice(deviceToken);
      setDevice(extractScannerDevice(payload));
      setDeviceLoadStatus("ready");
      setScanStatus("idle");
      setReadyMessage("");
      void loadRecentActivity();
    } catch (error) {
      const message = !deviceToken && (error?.status === 403 || error?.status === 410)
        ? "This Scanner Mode launch link has expired. Return to the merchant dashboard to open Scanner Mode again."
        : isProbablyNetworkError(error)
        ? "Could not connect to this scanner device."
        : getScanMessage(error);
      console.error("Scanner device fetch failed", {
        status: error?.status || "network",
        message,
        endpoint: "/api/merchant/scanner/device?credential=[redacted]",
      });
      setDeviceError(message);
      setDeviceLoadStatus("error");
      setScanStatus("idle");
    } finally {
      focusScannerInput();
    }
  }

  async function loadRecentActivity() {
    try {
      const payload = await fetchScannerActivity(deviceToken);
      setRecentActivity(normalizeScannerActivities(payload));
      setActivityLoadStatus("loaded");
      return true;
    } catch (error) {
      console.error("Scanner activity fetch failed", {
        status: error?.status || "network",
        endpoint: "/api/merchant/scanner/activity?credential=[redacted]",
      });
      setActivityLoadStatus("error");
      return false;
    }
  }

  function addFallbackActivity(type, result) {
    const fallback = createOptimisticScannerActivity(type, {
      customerId: pickFirst(result?.customerId, result?.customer?.id),
      customerName: getScanCustomerName(result),
      passSerialNumber: pickFirst(result?.passSerialNumber, result?.passSerial, result?.serialNumber),
      stampCount: getScanCurrentStamps(result),
    });
    setRecentActivity((current) => prependScannerActivity(current, fallback));
  }

  const onLoadDevice = useEffectEvent(loadDevice);

  useEffect(() => {
    onLoadDevice();
    return () => {
      window.clearTimeout(readyTimerRef.current);
      window.clearTimeout(bufferTimerRef.current);
    };
  }, [deviceToken, launchCredential]);

  useEffect(() => {
    focusScannerInput();
  }, [deviceLoadStatus, scanStatus, isProcessing]);

  useEffect(() => {
    function recoverScannerFocus() {
      if (document.visibilityState === "visible") focusScannerInput();
    }
    function updateFullscreenState() {
      setIsFullscreen(Boolean(
        document.fullscreenElement ||
        window.matchMedia?.("(display-mode: fullscreen)").matches ||
        window.matchMedia?.("(display-mode: standalone)").matches ||
        window.navigator.standalone,
      ));
      recoverScannerFocus();
    }
    window.addEventListener("focus", recoverScannerFocus);
    window.addEventListener("pageshow", recoverScannerFocus);
    window.addEventListener("orientationchange", recoverScannerFocus);
    document.addEventListener("visibilitychange", recoverScannerFocus);
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => {
      window.removeEventListener("focus", recoverScannerFocus);
      window.removeEventListener("pageshow", recoverScannerFocus);
      window.removeEventListener("orientationchange", recoverScannerFocus);
      document.removeEventListener("visibilitychange", recoverScannerFocus);
      document.removeEventListener("fullscreenchange", updateFullscreenState);
    };
  }, []);

  useEffect(() => {
    if (isManualOpen) window.setTimeout(() => manualInputRef.current?.focus({ preventScroll: true }), 40);
    else focusScannerInput();
  }, [isManualOpen]);

  async function handleScanSubmit(value = scanValue) {
    if (rewardDecisionPending) {
      clearGlobalScannerBuffer();
      return;
    }
    const trimmedValue = normalizeScannerScanValue(value);
    if (!trimmedValue) {
      setScanValue("");
      setReadyMessage("Enter or scan a pass code first.");
      if (deviceLoadStatus === "ready") setScanStatus("idle");
      focusScannerInput();
      return;
    }

    if (scanActionControllerRef.current.state().pending || isProcessing || deviceLoadStatus !== "ready") {
      focusScannerInput();
      return;
    }

    redemptionActionControllerRef.current.clear();
    adjustmentActionControllerRef.current.clear();
    window.clearTimeout(readyTimerRef.current);
    clearGlobalScannerBuffer();
    setIsProcessing(true);
    setScanValue("");
    updateManualCode("");
    setReadyMessage("");
    setQuickAddError("");
    setScanStatus("processing");

    try {
      const execution = await scanActionControllerRef.current.submit(trimmedValue, (requestId) =>
        submitScannerScan({ deviceToken, scanValue: trimmedValue, requestId }));
      if (!execution.accepted) return;
      const payload = execution.value;
      const nextStatus = getScanStatus(payload);
      setScanResult(payload);
      setScanStatus(nextStatus);
      if (nextStatus === "reward_ready") setIsManualOpen(false);
      if (nextStatus === "stamp_added" || nextStatus === "reward_ready") {
        notifyMerchantDataChanged({ source: "scanner", action: nextStatus });
      }
      if (nextStatus === "stamp_added" || nextStatus === "reward_ready") {
        if (!await loadRecentActivity()) addFallbackActivity("stamp_added", payload);
      }
      if (nextStatus !== "reward_ready") scheduleReady(nextStatus === "stamp_added" ? 3200 : 5200);
    } catch (error) {
      const errorResult = { message: getScanMessage(error) };
      setScanResult(errorResult);
      setScanStatus("scan_error");
      scheduleReady(6200);
    } finally {
      setIsProcessing(false);
      focusScannerInput();
    }
  }

  const onBufferedScanSubmit = useEffectEvent(handleScanSubmit);

  useEffect(() => {
    const minScanLength = 8;
    const scannerKeyGapMs = 120;
    const scannerIdleSubmitMs = 220;

    function isProtectedTarget(target) {
      if (!(target instanceof Element)) return false;
      if (target === inputRef.current) return false;
      return Boolean(target.closest("input, textarea, select, button, [contenteditable]"));
    }

    function submitBufferedScan() {
      const bufferedValue = normalizeScannerScanValue(scannerBufferRef.current);
      clearGlobalScannerBuffer();

      if (bufferedValue.length < minScanLength) {
        setReadyMessage("");
        return;
      }
      if (scanActionControllerRef.current.state().pending || isProcessing || deviceLoadStatus !== "ready") return;

      onBufferedScanSubmit(bufferedValue);
    }

    function handleGlobalScannerKeyDown(event) {
      if (scanStatus === "reward_ready") {
        clearGlobalScannerBuffer();
        return;
      }
      if (isCameraOpen || adjustment.isOpen) {
        clearGlobalScannerBuffer();
        return;
      }

      if (isProtectedTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.isTrusted && event.key !== "Escape") enterScannerFullscreen();

      if (event.key === "Enter") {
        if (scannerBufferRef.current) {
          event.preventDefault();
          submitBufferedScan();
        }
        return;
      }

      if (event.key.length !== 1) return;

      const now = Date.now();
      if (lastKeyTimeRef.current && now - lastKeyTimeRef.current > scannerKeyGapMs) {
        scannerBufferRef.current = "";
      }

      scannerBufferRef.current += event.key;
      lastKeyTimeRef.current = now;

      if (deviceLoadStatus === "ready" && !isProcessing) {
        setReadyMessage("Scan detected...");
      }

      window.clearTimeout(bufferTimerRef.current);
      bufferTimerRef.current = window.setTimeout(submitBufferedScan, scannerIdleSubmitMs);
    }

    document.addEventListener("keydown", handleGlobalScannerKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalScannerKeyDown);
      window.clearTimeout(bufferTimerRef.current);
    };
  }, [adjustment.isOpen, deviceLoadStatus, isCameraOpen, isProcessing, scanStatus]);

  function handleCameraDetected(decodedValue) {
    if (isProcessing || rewardDecisionPending) return;
    setIsCameraOpen(false);
    handleScanSubmit(decodedValue);
  }

  async function openAdjustment(sourceResult = scanResult, lookupValue = "") {
    if (rewardDecisionPending) return;
    const baseResult = sourceResult || (lookupValue ? { scanValue: lookupValue } : null);
    if (!baseResult && !lookupValue) {
      setReadyMessage("Scan or enter a pass code before adjusting stamps.");
      focusScannerInput();
      return;
    }

    window.clearTimeout(readyTimerRef.current);
    adjustmentActionControllerRef.current.clear();
    const lookupSequence = adjustmentLookupSequenceRef.current + 1;
    adjustmentLookupSequenceRef.current = lookupSequence;
    setAdjustment({
      isOpen: true,
      result: baseResult,
      isLoading: true,
      isReady: false,
      isSaving: false,
      error: "",
      success: "",
      note: "",
      authoritativeStamps: null,
    });

    try {
      const lookupIdentifier = normalizeScannerScanValue(getScannerLookupIdentifier({
        ...baseResult,
        passSerial: getScanPassSerial(baseResult),
        customerId: getScanCustomerId(baseResult),
      }, lookupValue));
      const payload = await lookupScannerPass({ deviceToken, scanValue: lookupIdentifier, scanResult: baseResult });
      const customerPass = getSuccessfulCustomerPass(payload);
      if (!customerPass) throw new Error("Customer lookup failed.");
      if (adjustmentLookupSequenceRef.current !== lookupSequence) return;
      setAdjustment((current) => ({
        ...current,
        result: customerPass,
        authoritativeStamps: Number(getScanCurrentStamps(customerPass) ?? 0),
        isLoading: false,
        isReady: true,
        error: "",
      }));
    } catch (error) {
      if (adjustmentLookupSequenceRef.current !== lookupSequence) return;
      setAdjustment((current) => ({
        ...current,
        isLoading: false,
        isReady: false,
        error: getScanMessage(error) || "Customer lookup is not available.",
      }));
    }
  }

  async function addQuickExtraStamp(item) {
    if (rewardDecisionPending) return;
    const targetStamps = getQuickExtraStampTarget(item, rewardThreshold);
    if (targetStamps === null || quickAddActionControllerRef.current.state().pending) return;
    const sourceResult = {
      customerId: item.customerId,
      customerName: item.customerName,
      passSerialNumber: item.passSerialNumber,
      currentStamps: item.stampCount,
      rewardThreshold,
    };
    const actionKey = JSON.stringify([item.passSerialNumber, targetStamps, "quick-extra-stamp"]);
    setQuickAddActivityId(item.id);
    setQuickAddError("");
    window.clearTimeout(readyTimerRef.current);
    try {
      const execution = await quickAddActionControllerRef.current.submit(actionKey, (requestId) =>
        adjustScannerStamps({
          deviceToken,
          scanResult: sourceResult,
          stamps: targetStamps,
          note: "Extra qualifying item",
          requestId,
        }));
      if (!execution.accepted) return;
      const payload = execution.value;
      const mergedResult = {
        ...sourceResult,
        ...(payload || {}),
        currentStamps: targetStamps,
        stamps: targetStamps,
        stampCount: targetStamps,
      };
      setScanResult(mergedResult);
      setScanStatus(payload?.rewardReady ? "reward_ready" : "stamp_added");
      if (!await loadRecentActivity()) addFallbackActivity("stamps_adjusted", mergedResult);
      notifyMerchantDataChanged({ source: "scanner", action: "stamp_adjusted" });
      if (!payload?.rewardReady) scheduleReady(3600);
    } catch (error) {
      setQuickAddError(getScanMessage(error));
    } finally {
      setQuickAddActivityId("");
      focusScannerInput();
    }
  }

  async function handleManualLookup() {
    if (rewardDecisionPending) return;
    const trimmedValue = readCurrentManualValue();
    if (!trimmedValue || isProcessing || deviceLoadStatus !== "ready") {
      setReadyMessage("Enter a pass code before looking up a customer.");
      clearManualAndScannerState();
      focusScannerInput();
      return;
    }

    clearManualAndScannerState();
    await openAdjustment({ scanValue: trimmedValue }, trimmedValue);
  }

  function handleManualSubmit() {
    if (rewardDecisionPending) return;
    const currentValue = readCurrentManualValue();
    clearManualAndScannerState();
    handleScanSubmit(currentValue);
  }

  function handleManualInput(event) {
    updateManualCode(event.currentTarget.value);
  }

  function handleManualPaste(event) {
    event.preventDefault();
    const input = event.currentTarget;
    const nextValue = applyManualPaste(
      input.value,
      event.clipboardData.getData("text"),
      input.selectionStart,
      input.selectionEnd,
    );
    input.value = nextValue;
    updateManualCode(nextValue);
  }

  function closeAdjustment() {
    adjustmentLookupSequenceRef.current += 1;
    adjustmentActionControllerRef.current.clear();
    setAdjustment((current) => ({ ...current, isOpen: false, isLoading: false, isReady: false, error: "", success: "", note: "", authoritativeStamps: null }));
    setScanStatus("idle");
    setScanResult(null);
    setReadyMessage("");
    clearManualAndScannerState();
    focusScannerInput();
  }

  function toggleManualEntry() {
    if (rewardDecisionPending) return;
    const wasOpen = isManualOpen;
    setIsManualOpen((current) => !current);
    if (wasOpen) {
      scanActionControllerRef.current.clear();
      clearManualAndScannerState();
      focusScannerInput();
    } else {
      inputRef.current?.blur();
    }
  }

  function updateAdjustmentStamps(nextValue) {
    adjustmentActionControllerRef.current.clear();
    setAdjustment((current) => {
      const threshold = Number(getScanRewardThreshold(current.result) ?? rewardThreshold ?? 10);
      const maxStamps = Number.isFinite(threshold) && threshold >= 0 ? threshold : 10;
      const numericValue = Number(nextValue);
      const safeValue = Number.isFinite(numericValue) ? Math.min(maxStamps, Math.max(0, numericValue)) : 0;
      return {
        ...current,
        result: {
          ...(current.result || {}),
          currentStamps: safeValue,
          stamps: safeValue,
          stampCount: safeValue,
        },
        error: "",
        success: "",
      };
    });
  }

  async function saveAdjustment(event) {
    event.preventDefault();
    if (!adjustment.isReady || adjustment.isLoading || adjustmentActionControllerRef.current.state().pending) return;
    const currentStamps = Number(getScanCurrentStamps(adjustment.result));
    const threshold = Number(getScanRewardThreshold(adjustment.result) ?? rewardThreshold ?? 10);
    const maxStamps = Number.isFinite(threshold) && threshold >= 0 ? threshold : 10;

    if (!Number.isInteger(currentStamps) || currentStamps < 0 || currentStamps > maxStamps) {
      setAdjustment((current) => ({
        ...current,
        error: `Enter a stamp count from 0 to ${maxStamps}.`,
        success: "",
      }));
      return;
    }

    const passBody = buildScannerPassBody(adjustment.result);
    if (!passBody.customerId && !passBody.passSerial && !passBody.passSerialNumber && !passBody.serialNumber) {
      setAdjustment((current) => ({
        ...current,
        error: "Customer/pass identifier is missing. Please scan or look up the Wallet pass again.",
        success: "",
      }));
      return;
    }

    const adjustmentKey = JSON.stringify([
      passBody.customerId || passBody.passSerial || passBody.passSerialNumber || passBody.serialNumber,
      currentStamps,
      adjustment.note,
    ]);
    setAdjustment((current) => ({ ...current, isSaving: true, error: "", success: "" }));

    try {
      const execution = await adjustmentActionControllerRef.current.submit(adjustmentKey, (requestId) =>
        adjustScannerStamps({
          deviceToken,
          scanResult: adjustment.result,
          stamps: currentStamps,
          note: adjustment.note,
          requestId,
        }));
      if (!execution.accepted) return;
      const payload = execution.value;
      const mergedResult = {
        ...(adjustment.result || {}),
        ...(payload || {}),
        currentStamps,
        stamps: currentStamps,
        stampCount: currentStamps,
        rewardThreshold: maxStamps,
      };

      setScanResult(mergedResult);
      setScanStatus(payload?.rewardReady ? "reward_ready" : "stamp_added");
      setAdjustment((current) => ({
        ...current,
        isOpen: !payload?.rewardReady,
        result: mergedResult,
        authoritativeStamps: currentStamps,
        isSaving: false,
        success: "Stamp count updated",
      }));
      if (!await loadRecentActivity()) addFallbackActivity("stamps_adjusted", mergedResult);
      notifyMerchantDataChanged({ source: "scanner", action: "stamp_adjusted" });
      if (!payload?.rewardReady) scheduleReady(3600);
    } catch (error) {
      setAdjustment((current) => ({
        ...current,
        isSaving: false,
        error: getScanMessage(error),
        success: "",
      }));
    } finally {
      focusScannerInput();
    }
  }

  async function handleRedeemReward() {
    if (!scanResult || redemptionActionControllerRef.current.state().pending || isProcessing) return;
    const redemptionKey = JSON.stringify(buildScannerPassBody(scanResult));
    setIsProcessing(true);

    try {
      const execution = await redemptionActionControllerRef.current.submit(redemptionKey, (requestId) =>
        redeemScannerReward({ deviceToken, scanResult, requestId }));
      if (!execution.accepted) return;
      const payload = execution.value;
      setScanResult(payload);
      setScanStatus("reward_redeemed");
      if (!await loadRecentActivity()) addFallbackActivity("reward_redeemed", payload);
      notifyMerchantDataChanged({ source: "scanner", action: "reward_redeemed" });
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
      if (!await loadRecentActivity()) addFallbackActivity("stamp_undone", payload);
      notifyMerchantDataChanged({ source: "scanner", action: "undo_success" });
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
      body: readyMessage || "Hold loyalty card under the scanner",
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
      className="ps-scanner-kiosk min-h-screen px-5 py-6 sm:px-8"
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
      <div
        ref={inputRef}
        tabIndex="-1"
        inputMode="none"
        virtualkeyboardpolicy="manual"
        aria-hidden="true"
        className="ps-scanner-capture fixed left-0 top-0 h-px w-px overflow-hidden opacity-0 outline-none"
      />

      {isCameraOpen ? (
        <CameraScannerModal
          isOpen
          isProcessing={isProcessing}
          onClose={closeCamera}
          onDetected={handleCameraDetected}
        />
      ) : null}

      <CustomerAdjustmentModal
        isOpen={adjustment.isOpen}
        customerResult={adjustment.result}
        isLoading={adjustment.isLoading}
        isReady={adjustment.isReady}
        isSaving={adjustment.isSaving}
        error={adjustment.error}
        success={adjustment.success}
        authoritativeStamps={adjustment.authoritativeStamps}
        fallbackThreshold={rewardThreshold}
        onChangeStamps={updateAdjustmentStamps}
        onChangeNote={(note) => {
          adjustmentActionControllerRef.current.clear();
          setAdjustment((current) => ({ ...current, note }));
        }}
        onSave={saveAdjustment}
        onClose={closeAdjustment}
      />

      <div className="ps-scanner-shell mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-5">
        <header className="ps-scanner-header flex flex-col gap-3 rounded-3xl bg-[#fffdf8]/90 p-5 text-[var(--ps-espresso)] ring-1 ring-[var(--ps-border)] sm:flex-row sm:items-center sm:justify-between">
          <div className="ps-scanner-identity flex min-w-0 items-center gap-4">
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
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase" style={{ color: scannerBranding.labelColor }}>
                PocketStamp Scanner Mode
              </p>
              <h1 className="mt-1 truncate text-2xl font-semibold">{merchantName}</h1>
              <p className="mt-1 text-sm font-semibold" style={{ color: scannerBranding.labelColor }}>
                {deviceName}
              </p>
            </div>
          </div>
          <div className="ps-scanner-device-meta flex flex-wrap gap-2 text-sm font-semibold text-[var(--ps-muted)]">
            {!isFullscreen && document.documentElement.requestFullscreen ? (
              <button type="button" onClick={enterScannerFullscreen} className="rounded-full bg-white px-3 py-2 ring-1 ring-[var(--ps-border)]">
                Enter fullscreen
              </button>
            ) : null}
            {scannerDeviceStatus ? <span className="rounded-full bg-white px-3 py-2 ring-1 ring-[var(--ps-border)]">{toTitle(scannerDeviceStatus)}</span> : null}
            {mode ? <span className="rounded-full bg-white px-3 py-2 ring-1 ring-[var(--ps-border)]">{toTitle(mode)}</span> : null}
            {cooldown ? <span className="rounded-full bg-white px-3 py-2 ring-1 ring-[var(--ps-border)]">{cooldown}s cooldown</span> : null}
            {rewardThreshold ? <span className="rounded-full bg-white px-3 py-2 ring-1 ring-[var(--ps-border)]">{rewardThreshold} stamps</span> : null}
          </div>
        </header>

        <section className={`ps-scanner-primary grid flex-1 place-items-center rounded-[2rem] p-7 text-center shadow-[var(--ps-shadow)] ring-2 ${toneClass}`}>
          <div className="ps-scanner-primary-inner mx-auto min-w-0 max-w-4xl">
            <div className="ps-scanner-status-icon mx-auto grid h-24 w-24 place-items-center rounded-full bg-white/70 text-5xl font-black ring-1 ring-current/15">
              {statusContent.icon}
            </div>
            <h2 className="ps-scanner-status-title mt-8 text-[clamp(3.2rem,9vw,7.4rem)] font-black leading-[0.92] tracking-normal">
              {statusContent.title}
            </h2>
            <p className="ps-scanner-status-body mx-auto mt-6 max-w-2xl text-[clamp(1.35rem,3vw,2.2rem)] font-semibold leading-tight">
              {statusContent.body}
            </p>

            <div className="ps-scanner-stats mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
              <KioskStat label="Customer" value={getScanCustomerName(scanResult)} />
              <KioskStat label="Stamps" value={getScanStamps(scanResult)} />
            </div>

            <div className="ps-scanner-actions mt-9 flex flex-wrap justify-center gap-3">
              {deviceLoadStatus === "ready" ? (
                <button
                  type="button"
                  onClick={() => {
                    window.clearTimeout(readyTimerRef.current);
                    scanActionControllerRef.current.clear();
                    clearManualAndScannerState();
                    inputRef.current?.blur();
                    setIsCameraOpen(true);
                  }}
                  disabled={isProcessing || rewardDecisionPending}
                  className="ps-button-primary bg-[var(--ps-espresso)] text-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Scan with tablet camera
                </button>
              ) : null}
              {["stamp_added", "already_stamped_recently", "reward_redeemed"].includes(displayStatus) && scanResult ? (
                <button
                  type="button"
                  onClick={() => openAdjustment(scanResult)}
                  disabled={isProcessing}
                  className="ps-button-secondary bg-white text-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  View / adjust customer
                </button>
              ) : null}
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
                      redemptionActionControllerRef.current.clear();
                      setScanStatus("idle");
                      setScanResult(null);
                      clearManualAndScannerState();
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
                      clearPendingActionRequests();
                      if (deviceLoadStatus === "ready") {
                        setScanStatus("idle");
                      } else {
                        loadDevice();
                      }
                      setScanResult(null);
                      clearManualAndScannerState();
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

        <footer className="ps-scanner-secondary grid gap-4 lg:grid-cols-[1fr_24rem]">
          <div className="ps-scanner-activity rounded-2xl bg-[#fffdf8]/82 p-4 ring-1 ring-[var(--ps-border)]">
            <p className="text-sm font-bold uppercase text-[var(--ps-muted)]">Recent activity</p>
            <div className="ps-scanner-activity-list mt-3 grid gap-2">
              {recentActivity.length ? recentActivity.filter(Boolean).map((item, index) => (
                  <div key={item.id || `scan-activity-${index}`} className="ps-scanner-activity-row grid gap-2 rounded-xl bg-white p-3 text-sm ring-1 ring-[var(--ps-border)]">
                    <span className="ps-scanner-activity-main min-w-0">
                      <span className="block font-semibold text-[var(--ps-muted)]">{formatScannerActivityTime(item.createdAt)}</span>
                      <span className="mt-0.5 block leading-snug">
                        <strong className="font-bold text-[var(--ps-espresso)]">{getScannerActivityFirstName(item.customerName)}</strong>
                        <span className="font-semibold text-[var(--ps-muted)]"> · {getScannerActivitySummary(item.type, item.stampCount)}</span>
                      </span>
                    </span>
                    {item.passSerialNumber ? (
                    <span className="ps-scanner-activity-actions flex items-center justify-end gap-1.5">
                      {index === 0 && getQuickExtraStampTarget(item, rewardThreshold) !== null ? (
                        <button
                          type="button"
                          onClick={() => addQuickExtraStamp(item)}
                          disabled={Boolean(quickAddActivityId) || rewardDecisionPending}
                          className="ps-scanner-row-action ps-button-secondary bg-white px-2.5 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {quickAddActivityId === item.id ? "Adding..." : "+1 more"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openAdjustment({
                          customerId: item.customerId,
                          customerName: item.customerName,
                          passSerialNumber: item.passSerialNumber,
                          currentStamps: item.stampCount,
                        })}
                        disabled={Boolean(quickAddActivityId) || rewardDecisionPending}
                        className="ps-scanner-row-action ps-button-secondary bg-white px-2.5 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Adjust
                      </button>
                    </span>
                  ) : null}
                </div>
              )) : activityLoadStatus === "loading" ? (
                <p className="rounded-xl bg-white p-3 text-sm font-semibold text-[var(--ps-muted)] ring-1 ring-[var(--ps-border)]">
                  Loading activity...
                </p>
              ) : activityLoadStatus === "loaded" ? (
                <p className="rounded-xl bg-white p-3 text-sm font-semibold text-[var(--ps-muted)] ring-1 ring-[var(--ps-border)]">
                  No scans yet.
                </p>
              ) : null}
              {quickAddError ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800 ring-1 ring-red-200">{quickAddError}</p> : null}
            </div>
          </div>
          <section className="ps-scanner-utilities rounded-2xl bg-[#fffdf8]/82 p-4 ring-1 ring-[var(--ps-border)]">
            <button
              type="button"
              onClick={toggleManualEntry}
              disabled={rewardDecisionPending}
              className="flex w-full items-center justify-between gap-3 text-left text-sm font-bold uppercase text-[var(--ps-muted)]"
            >
              <span>Manual code entry</span>
              <span className="text-lg">{isManualOpen ? "-" : "+"}</span>
            </button>
            {isManualOpen ? (
              <form
                className="mt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleManualSubmit();
                }}
              >
                <label className="block">
                  <span className="sr-only">Manual pass code</span>
                  <input
                    ref={manualInputRef}
                    value={manualCode}
                    onChange={handleManualInput}
                    onPaste={handleManualPaste}
                    className="ps-input bg-white"
                    placeholder="Paste or type a pass code"
                    disabled={isProcessing || rewardDecisionPending}
                  />
                </label>
                <p className="mt-2 text-sm font-semibold text-[var(--ps-muted)]">
                  Use this only if the scanner/camera cannot read the Wallet QR.
                </p>
                <div className="mt-3 grid gap-2">
                  <button type="submit" disabled={isProcessing || rewardDecisionPending} className="ps-button-secondary w-full bg-white disabled:cursor-not-allowed disabled:opacity-60">
                    Submit scan
                  </button>
                  <button
                    type="button"
                    onClick={handleManualLookup}
                    disabled={isProcessing || adjustment.isLoading || rewardDecisionPending}
                    className="ps-button-secondary w-full bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Look up customer
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </footer>
      </div>
    </main>
  );
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const navigate = (nextPath, { replace = false } = {}) => {
    window.history[replace ? "replaceState" : "pushState"](null, "", nextPath);
    setPathname(window.location.pathname);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  if (pathname === "/pricing" || pathname === "/pricing/") return <PricingPage />;

  if (pathname === "/dashboard-demo" || pathname === "/dashboard-demo/" || pathname.startsWith("/dashboard-demo/")) {
    return <MerchantDashboardDemo />;
  }

  if (pathname === demoJoinUrl) {
    return <DemoJoinPage />;
  }

  if (pathname === demoSuccessUrl) {
    return <DemoSuccessPage />;
  }

  if (pathname === contactUrl || pathname === `${contactUrl}/`) {
    return <ContactPage />;
  }

  if (pathname === privacyPolicyUrl || pathname === `${privacyPolicyUrl}/`) {
    return <PublicLegalPage type="privacy" />;
  }

  if (pathname === loyaltyTermsUrl || pathname === `${loyaltyTermsUrl}/`) {
    return <PublicLegalPage type="terms" />;
  }

  if (pathname === "/download" || pathname === "/download/") {
    return <ScannerDownloadPage />;
  }

  if (isMerchantSetupPath(pathname)) {
    return <MerchantSetup tokenStorageKey={TOKEN_STORAGE_KEY} />;
  }

  if (isMerchantForgotPasswordPath(pathname)) return <MerchantForgotPassword />;
  if (isMerchantResetPasswordPath(pathname)) return <MerchantResetPassword />;

  if (isMerchantScannerPath(pathname)) {
    return (
      <ScannerRenderBoundary>
        <ScannerKioskPage />
      </ScannerRenderBoundary>
    );
  }

  if (pathname.startsWith("/merchant")) {
    const merchantPage = resolveMerchantManagementPage(pathname);
    if (!merchantPage) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-6 text-slate-950">
          <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase text-[#2f6df6]">PocketStamp Merchant</p>
            <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
            <p className="mt-3 leading-7 text-slate-600">This merchant page does not exist.</p>
            <a href="/merchant" className="mt-6 inline-flex rounded-full bg-[#143d3b] px-5 py-3 font-semibold text-white">
              Return to Overview
            </a>
          </div>
        </main>
      );
    }
    return (
      <MerchantPortalShell
        DashboardComponent={MerchantDashboard}
        tokenStorageKey={TOKEN_STORAGE_KEY}
        page={merchantPage}
      />
    );
  }

  if (pathname === "/admin/set-password") {
    return <AdminSetPasswordPage onNavigate={navigate} />;
  }

  if (pathname.startsWith("/admin")) {
    return <AdminPortal path={pathname} onNavigate={navigate} />;
  }

  return <MarketingHomepage />;
}
