export const MERCHANT_MANAGEMENT_ROUTES = Object.freeze({
  "/merchant": "overview",
  "/merchant/": "overview",
  "/merchant/customers": "customers",
  "/merchant/activity": "activity",
  "/merchant/marketing": "marketing",
  "/merchant/get-customers": "get-customers",
});

export function resolveMerchantManagementPage(pathname) {
  return MERCHANT_MANAGEMENT_ROUTES[pathname] || null;
}

export function isMerchantSetupPath(pathname) {
  return pathname === "/merchant/setup";
}

export function isMerchantScannerPath(pathname) {
  return pathname === "/merchant/scanner";
}
