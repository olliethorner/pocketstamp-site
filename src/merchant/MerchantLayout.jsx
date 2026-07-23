import { useEffect, useState } from "react";

const navigation = [
  ["/merchant", "Overview", "overview"],
  ["/merchant/customers", "Customers", "customers"],
  ["/merchant/activity", "Activity", "activity"],
  ["/merchant/marketing", "Marketing", "marketing"],
  ["/merchant/get-customers", "Get Customers", "get-customers"],
];

export default function MerchantLayout({
  children,
  merchantContext,
  page,
  pageTitle,
  scannerUrl,
  onLogout,
  onRefresh,
  refreshLabel,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [page]);

  function NavigationLinks() {
    return (
      <nav aria-label="Merchant navigation" className="space-y-1">
        {navigation.map(([href, label, pageKey]) => (
          <a
            key={href}
            href={href}
            aria-current={page === pageKey ? "page" : undefined}
            className={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              page === pageKey
                ? "bg-[var(--ps-espresso)] text-white"
                : "text-[var(--ps-muted)] hover:bg-white hover:text-[var(--ps-espresso)]"
            }`}
          >
            {label}
          </a>
        ))}
      </nav>
    );
  }

  function ScannerAction() {
    return scannerUrl ? (
      <a
        href={scannerUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--ps-blue)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#255ddd]"
      >
        Open Scanner Mode
      </a>
    ) : (
      <div className="rounded-xl border border-[var(--ps-border)] bg-white/60 px-4 py-3">
        <p className="text-sm font-semibold text-[var(--ps-espresso)]">Scanner Mode</p>
        <p className="mt-1 text-xs leading-5 text-[var(--ps-muted)]">
          No scanner launch link is available.
        </p>
      </div>
    );
  }

  return (
    <main className="ps-dashboard min-h-screen text-[var(--ps-espresso)]">
      <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-[var(--ps-border)] bg-[rgba(255,253,248,0.82)] lg:flex lg:min-h-screen lg:flex-col lg:p-5">
          <a href="/merchant" className="flex items-center gap-3" aria-label="PocketStamp merchant overview">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ps-espresso)] text-sm font-bold text-white">PS</span>
            <span className="font-semibold">PocketStamp</span>
          </a>
          <div className="mt-6 min-w-0">
            <p className="truncate font-semibold">{merchantContext.merchantName}</p>
            <p className="mt-1 truncate text-xs text-[var(--ps-muted)]">
              {merchantContext.locationName}
            </p>
          </div>
          <div className="mt-6"><NavigationLinks /></div>
          <div className="mt-6 border-t border-[var(--ps-border)] pt-5"><ScannerAction /></div>
          <div className="mt-auto border-t border-[var(--ps-border)] pt-5">
            <p className="truncate text-xs font-semibold uppercase text-[var(--ps-muted)]">{merchantContext.role}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={onRefresh} className="rounded-xl border border-[var(--ps-border)] bg-white px-3 py-2 text-sm font-semibold">
                {refreshLabel}
              </button>
              <button type="button" onClick={onLogout} className="rounded-xl border border-[var(--ps-border)] bg-white px-3 py-2 text-sm font-semibold">
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-b border-[var(--ps-border)] bg-[rgba(255,253,248,0.9)] lg:hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <a href="/merchant" className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-espresso)] text-xs font-bold text-white">PS</span>
                <span className="min-w-0">
                  <span className="block font-semibold">PocketStamp</span>
                  <span className="block truncate text-xs text-[var(--ps-muted)]">{merchantContext.merchantName}</span>
                </span>
              </a>
              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-controls="merchant-mobile-menu"
                onClick={() => setIsMenuOpen((open) => !open)}
                className="rounded-xl border border-[var(--ps-border)] bg-white px-4 py-2 text-sm font-semibold"
              >
                {isMenuOpen ? "Close" : "Menu"}
              </button>
            </div>
            {isMenuOpen ? (
              <div id="merchant-mobile-menu" className="border-t border-[var(--ps-border)] px-5 py-4">
                <NavigationLinks />
                <div className="mt-4 border-t border-[var(--ps-border)] pt-4"><ScannerAction /></div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={onRefresh} className="rounded-xl border border-[var(--ps-border)] bg-white px-3 py-2 text-sm font-semibold">{refreshLabel}</button>
                  <button type="button" onClick={onLogout} className="rounded-xl border border-[var(--ps-border)] bg-white px-3 py-2 text-sm font-semibold">Logout</button>
                </div>
              </div>
            ) : null}
          </header>

          <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8">
            <div className="mb-7">
              <p className="text-sm font-semibold uppercase text-[var(--ps-blue)]">PocketStamp Merchant</p>
              <h1 className="mt-1 text-3xl font-semibold">{pageTitle}</h1>
              <p className="mt-1 text-sm text-[var(--ps-muted)] lg:hidden">
                {merchantContext.locationName} · {merchantContext.role}
              </p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
