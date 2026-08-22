const cache = {
  activeAccounts: null,
  activeLoadedAt: 0,
  archivedAccounts: null,
  archivedCount: 0,
  details: new Map(),
  pendingDetails: new Map(),
  merchants: new Map(),
};

export function clearAdminCrmCache() {
  cache.activeAccounts = null;
  cache.activeLoadedAt = 0;
  cache.archivedAccounts = null;
  cache.archivedCount = 0;
  cache.details.clear();
  cache.pendingDetails.clear();
  cache.merchants.clear();
}

export function getAccountLists() {
  return {
    activeAccounts: cache.activeAccounts,
    archivedAccounts: cache.archivedAccounts,
    archivedCount: cache.archivedCount,
    activeLoadedAt: cache.activeLoadedAt,
  };
}

export function setAccountList(accounts, { archived = false, archivedCount } = {}) {
  const next = accounts || [];
  if (archived) cache.archivedAccounts = next;
  else {
    cache.activeAccounts = next;
    cache.activeLoadedAt = Date.now();
  }
  if (Number.isFinite(archivedCount)) cache.archivedCount = archivedCount;
  for (const account of next) {
    if (account?.merchant?.id) cache.merchants.set(account.merchant.id, account.merchant);
  }
  return next;
}

export function getAccountSummary(accountId) {
  return [...(cache.activeAccounts || []), ...(cache.archivedAccounts || [])]
    .find((account) => account.id === accountId) || null;
}

export function getAccountDetail(accountId) {
  return cache.details.get(accountId) || null;
}

export function setAccountDetail(accountId, payload) {
  cache.details.set(accountId, payload);
  const updated = payload?.account;
  if (updated) {
    const activeAccount = cache.activeAccounts?.find((account) => account.id === accountId);
    const archivedAccount = cache.archivedAccounts?.find((account) => account.id === accountId);
    const previous = activeAccount || archivedAccount || {};
    const reconciled = { ...previous, ...updated };
    const movedToArchive = Boolean(activeAccount && updated.archived_at);
    const movedToActive = Boolean(archivedAccount && !updated.archived_at);
    if (cache.activeAccounts) {
      cache.activeAccounts = cache.activeAccounts.filter((account) => account.id !== accountId);
      if (!updated.archived_at) cache.activeAccounts.push(reconciled);
    }
    if (cache.archivedAccounts) {
      cache.archivedAccounts = cache.archivedAccounts.filter((account) => account.id !== accountId);
      if (updated.archived_at) cache.archivedAccounts.push(reconciled);
    }
    if (movedToArchive) cache.archivedCount += 1;
    if (movedToActive) cache.archivedCount = Math.max(0, cache.archivedCount - 1);
    if (updated.merchant?.id) cache.merchants.set(updated.merchant.id, updated.merchant);
  }
  return payload;
}

export function prefetchAccountDetail(accountId, loader) {
  if (cache.details.has(accountId)) return Promise.resolve(cache.details.get(accountId));
  if (cache.pendingDetails.has(accountId)) return cache.pendingDetails.get(accountId);
  const pending = loader()
    .then((payload) => setAccountDetail(accountId, payload))
    .finally(() => cache.pendingDetails.delete(accountId));
  cache.pendingDetails.set(accountId, pending);
  return pending;
}

export function getMerchantSummary(merchantId) {
  return cache.merchants.get(merchantId) || null;
}

export function setMerchantSummary(merchant) {
  if (merchant?.id) cache.merchants.set(merchant.id, merchant);
  return merchant;
}
