export function getMerchantPageDatasets(page) {
  if (page === "customers") return ["customers"];
  if (page === "marketing") return ["dashboard", "campaigns"];
  if (page === "overview" || page === "activity") return ["dashboard"];
  return [];
}
