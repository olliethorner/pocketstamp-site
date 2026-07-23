import { useEffect, useState } from "react";
import {
  CUSTOMER_PAGE_SIZE,
  formatCustomerShortDate,
  getCustomerDetailFields,
  getCustomerId,
  getCustomerName,
  getCustomerStampProgress,
  getCustomerStatus,
  getCustomerStatusClass,
  getVisibleCustomers,
  supportsScannedTodayFilter,
} from "../utils/customerData.js";

const baseFilters = [
  ["all", "All"],
  ["almost_there", "Almost there"],
  ["reward_ready", "Reward ready"],
  ["birthday_saved", "Birthday saved"],
];

function Pagination({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-sm font-semibold text-slate-500">Page {page} of {pageCount}</p>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-45">Previous</button>
        <button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-45">Next</button>
      </div>
    </div>
  );
}

export default function MerchantCustomers({
  customers,
  isLoading,
  error,
  search,
  onSearchChange,
  status,
  onStatusChange,
  expandedCustomerId,
  onExpandedCustomerChange,
  birthdayRewardsEnabled = false,
}) {
  const [page, setPage] = useState(1);
  const scannedTodaySupported = supportsScannedTodayFilter(customers);
  const filters = [
    ...baseFilters.filter(([value]) => birthdayRewardsEnabled || value !== "birthday_saved"),
    ...(scannedTodaySupported ? [["scanned_today", "Scanned today"]] : []),
  ];
  const visibleCustomers = getVisibleCustomers(customers, status);
  const pageCount = Math.max(1, Math.ceil(visibleCustomers.length / CUSTOMER_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * CUSTOMER_PAGE_SIZE;
  const pagedCustomers = visibleCustomers.slice(pageStart, pageStart + CUSTOMER_PAGE_SIZE);

  useEffect(() => setPage(1), [search, status]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const countText = isLoading
    ? "Loading customers"
    : visibleCustomers.length
      ? `Showing ${pageStart + 1}-${Math.min(pageStart + CUSTOMER_PAGE_SIZE, visibleCustomers.length)} of ${visibleCustomers.length} returned customers`
      : "Showing 0 customers";

  const emptyText = search.trim()
    ? "No customers match your search."
    : status === "scanned_today"
      ? "No customers in these results were scanned today."
      : status !== "all"
        ? "No customers match this filter."
        : "No loyalty customers yet. Customers will appear here after they create an Apple Wallet card.";

  return (
    <section>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Loyalty customers</h2>
          <p className="mt-1 text-sm text-[var(--ps-muted)]">See customer progress and recent loyalty activity.</p>
          <p className="mt-2 text-sm font-semibold text-[var(--ps-muted)]">{countText}</p>
        </div>
        <label className="w-full md:max-w-sm">
          <span className="sr-only">Search loyalty customers</span>
          <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by name or email" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#16856f] focus:ring-4 focus:ring-[#16856f]/10" />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Customer status filters">
        {filters.map(([value, label]) => (
          <button key={value} type="button" onClick={() => onStatusChange(value)} aria-pressed={status === value} className={`rounded-full px-3 py-2 text-sm font-semibold transition ${status === value ? "bg-[#143d3b] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {isLoading ? <div className="p-5 text-slate-600">Loading loyalty customers...</div>
          : error ? <div className="p-5 text-red-700">{error}</div>
            : !visibleCustomers.length ? <div className="p-5 text-slate-600">{emptyText}</div>
              : <div className="divide-y divide-slate-100">
                {pagedCustomers.map((customer, index) => {
                  const customerId = getCustomerId(customer, pageStart + index);
                  const customerStatus = getCustomerStatus(customer, birthdayRewardsEnabled);
                  const isExpanded = expandedCustomerId === customerId;
                  return (
                    <div key={customerId}>
                      <button type="button" aria-expanded={isExpanded} onClick={() => onExpandedCustomerChange(isExpanded ? null : customerId)} className="grid w-full gap-3 p-4 text-left hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-950">{getCustomerName(customer)}</span>
                          <span className="mt-1 block truncate text-sm text-slate-500">{customer.email || "No email saved"}</span>
                        </span>
                        <span className="grid grid-cols-[auto_auto] items-center justify-start gap-2 sm:flex sm:justify-end">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">{getCustomerStampProgress(customer)} stamps</span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getCustomerStatusClass(customerStatus)}`}>{customerStatus}</span>
                          <span className="col-span-2 text-sm text-slate-500 sm:col-span-1">Last activity {formatCustomerShortDate(customer.lastUpdated)}</span>
                          <span aria-hidden="true" className={`text-slate-400 ${isExpanded ? "rotate-180" : ""}`}>⌄</span>
                        </span>
                      </button>
                      {isExpanded ? (
                        <div className="border-t border-slate-100 bg-[#fbfaf7] px-4 py-4 sm:px-5">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {getCustomerDetailFields(customer, birthdayRewardsEnabled).map(([label, value]) => (
                              <div key={label} className="min-w-0">
                                <p className="text-xs font-semibold text-slate-400">{label}</p>
                                <p className="mt-1 truncate text-sm font-semibold text-slate-700" title={String(value)}>{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>}
      </div>
      <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
    </section>
  );
}
