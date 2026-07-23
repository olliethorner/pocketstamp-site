import { useEffect, useState } from "react";
import MerchantLogin from "./MerchantLogin.jsx";
import { fetchMerchantMe } from "./api/merchantApi.js";
import { resolveMerchantManagementPage } from "./merchantRoutes.js";
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
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(accessToken));
  const [activePage, setActivePage] = useState(page);

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
        localStorage.removeItem(tokenStorageKey);
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
  }, [accessToken, tokenStorageKey]);

  useEffect(() => {
    function handlePopState() {
      const nextPage = resolveMerchantManagementPage(window.location.pathname);
      if (nextPage) setActivePage(nextPage);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
    localStorage.removeItem(tokenStorageKey);
    setAccessToken(null);
    setMerchantContext(null);
  }

  function handleNavigate(href, nextPage) {
    window.history.pushState({}, "", href);
    setActivePage(nextPage);
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] text-slate-600">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
          Checking merchant session...
        </div>
      </main>
    );
  }

  if (!accessToken || !merchantContext) {
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
