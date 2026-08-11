import { useCallback, useEffect, useRef, useState } from "react";
import MerchantLogin from "./MerchantLogin.jsx";
import {
  fetchMerchantMe,
  logoutMerchant,
  refreshMerchantSession,
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
  const readSession = useCallback(() => {
    try {
      const value = JSON.parse(localStorage.getItem(tokenStorageKey));
      return value?.accessToken ? value : null;
    } catch { return null; }
  }, [tokenStorageKey]);
  const [session, setSession] = useState(readSession);
  const accessToken = session?.accessToken || null;
  const [merchantContext, setMerchantContext] = useState(null);
  const [authState, setAuthState] = useState(() =>
    readSession() ? "checking" : "unauthenticated",
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
    setSession(null);
    setMerchantContext(null);
    setAuthError("");
    setAuthState("unauthenticated");
  }, [tokenStorageKey]);

  const applySession = useCallback((nextSession) => {
    localStorage.setItem(tokenStorageKey, JSON.stringify(nextSession));
    setSession(nextSession);
  }, [tokenStorageKey]);

  useEffect(() => {
    if (!session?.refreshToken) return undefined;
    const delay = Math.max(0, (session.expiresAt || 0) - Date.now() - 60000);
    const timer = window.setTimeout(async () => {
      try {
        const payload = await refreshMerchantSession(session.refreshToken);
        const next = payload?.session;
        if (!next?.accessToken || !next?.refreshToken) throw new Error("Invalid refreshed session");
        applySession({ accessToken: next.accessToken, refreshToken: next.refreshToken, expiresAt: Date.now() + Number(next.expiresIn || 3600) * 1000 });
        setMerchantContext(normalizeMerchantContext(payload));
      } catch { clearMerchantSession(); }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session, applySession, clearMerchantSession]);

  useEffect(
    () => setMerchantAuthenticationFailureHandler(clearMerchantSession),
    [clearMerchantSession],
  );

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      if (!accessToken || authState !== "checking") return;

      try {
        let tokenToValidate = accessToken;
        if (session?.refreshToken && session.expiresAt < Date.now() + 60000) {
          const refreshed = await refreshMerchantSession(session.refreshToken);
          const next = refreshed?.session;
          if (!next?.accessToken || !next?.refreshToken) throw new Error("Invalid refreshed session");
          const nextSession = { accessToken: next.accessToken, refreshToken: next.refreshToken, expiresAt: Date.now() + Number(next.expiresIn || 3600) * 1000 };
          tokenToValidate = nextSession.accessToken;
          applySession(nextSession);
        }
        const payload = await fetchMerchantMe(tokenToValidate);
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
  }, [accessToken, authState, session, applySession, clearMerchantSession]);

  useEffect(() => {
    function handlePopState() {
      const nextPage = resolveMerchantManagementPage(window.location.pathname);
      if (nextPage) setActivePage(nextPage);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleLogin(nextSession) {
    hasHandledAuthenticationFailureRef.current = false;
    resetMerchantAuthenticationFailure();
    applySession(nextSession);
    setMerchantContext(null);
    setAuthError("");
    setAuthState("checking");
  }

  async function handleLogout() {
    hasHandledAuthenticationFailureRef.current = false;
    if (accessToken) await logoutMerchant(accessToken).catch(() => {});
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

  if (authState === "unauthenticated" || !session || !merchantContext) {
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
