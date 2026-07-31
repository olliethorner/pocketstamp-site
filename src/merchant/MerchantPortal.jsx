import { useCallback, useEffect, useRef, useState } from "react";
import MerchantLogin from "./MerchantLogin.jsx";
import {
  fetchMerchantMe,
  isMerchantAuthenticationError,
  resetMerchantAuthenticationFailure,
  setMerchantAuthenticationFailureHandler,
} from "./api/merchantApi.js";
import {
  resolveMerchantManagementPage,
  resolveSafeMerchantReturnTo,
} from "./merchantRoutes.js";
import { normalizeMerchantContext } from "./utils/merchantData.js";

export default function MerchantPortal({
  DashboardComponent,
  tokenStorageKey,
  page,
}) {
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem(tokenStorageKey),
  );
  const [merchantContext, setMerchantContext] = useState(null);
  const [authState, setAuthState] = useState(() =>
    localStorage.getItem(tokenStorageKey) ? "checking" : "unauthenticated",
  );
  const [authError, setAuthError] = useState("");
  const [activePage, setActivePage] = useState(
    () => resolveSafeMerchantReturnTo(
      window.location.href,
      window.location.origin,
    ).page || page,
  );
  const hasHandledAuthenticationFailureRef = useRef(false);

  const clearMerchantSession = useCallback(() => {
    if (hasHandledAuthenticationFailureRef.current) return;
    hasHandledAuthenticationFailureRef.current = true;
    localStorage.removeItem(tokenStorageKey);
    setAccessToken(null);
    setMerchantContext(null);
    setAuthError("");
    setAuthState("unauthenticated");
  }, [tokenStorageKey]);

  useEffect(
    () => setMerchantAuthenticationFailureHandler(clearMerchantSession),
    [clearMerchantSession],
  );

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      if (!accessToken || authState !== "checking") return;

      try {
        const payload = await fetchMerchantMe(accessToken);
        if (isMounted) {
          resetMerchantAuthenticationFailure();
          hasHandledAuthenticationFailureRef.current = false;
          setMerchantContext(normalizeMerchantContext(payload));
          setAuthError("");
          setAuthState("authenticated");
        }
      } catch (sessionError) {
        if (!isMounted) return;
        if (isMerchantAuthenticationError(sessionError)) {
          clearMerchantSession();
        } else {
          setMerchantContext(null);
          setAuthError("We couldn’t load your dashboard right now.");
          setAuthState("error");
        }
      }
    }

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [accessToken, authState, clearMerchantSession]);

  useEffect(() => {
    function handlePopState() {
      const nextPage = resolveMerchantManagementPage(window.location.pathname);
      if (nextPage) setActivePage(nextPage);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleLogin(token) {
    hasHandledAuthenticationFailureRef.current = false;
    resetMerchantAuthenticationFailure();
    setAccessToken(token);
    setMerchantContext(null);
    setAuthError("");
    setAuthState("checking");
  }

  function handleLogout() {
    hasHandledAuthenticationFailureRef.current = false;
    clearMerchantSession();
  }

  function handleNavigate(href, nextPage) {
    window.history.pushState({}, "", href);
    setActivePage(nextPage);
  }

  function handleRetryAuthentication() {
    setAuthError("");
    setAuthState("checking");
  }

  if (authState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-6 text-slate-600">
        <div role="status" className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
          Checking merchant session...
        </div>
      </main>
    );
  }

  if (authState === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-6 text-slate-950">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-semibold">Dashboard temporarily unavailable</h1>
          <p className="mt-3 leading-7 text-slate-600">{authError}</p>
          <button className="ps-button-primary mt-6" type="button" onClick={handleRetryAuthentication}>
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (authState === "unauthenticated" || !accessToken || !merchantContext) {
    return (
      <MerchantLogin
        onLogin={handleLogin}
        tokenStorageKey={tokenStorageKey}
      />
    );
  }

  return (
    <DashboardComponent
      accessToken={accessToken}
      merchantContext={merchantContext}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      page={activePage}
    />
  );
}
