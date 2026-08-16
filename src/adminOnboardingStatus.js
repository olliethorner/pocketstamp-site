const ASSET_GROUPS = Object.freeze([
  Object.freeze(["join_poster_pdf", "join_poster_png"]),
  Object.freeze(["sales_sheet_pdf", "sales_sheet_png"]),
]);

export function generatedAssetGroupState(assets, types) {
  const rows = types.map((type) => (assets || []).find((asset) => asset.assetType === type));
  if (rows.every((asset) => asset?.status === "ready")) return "ready";
  if (rows.some((asset) => asset?.status === "failed")) return "failed";
  return "generating";
}

export function shouldPollOnboardingStatus({ readiness, assets, scheduleState } = {}) {
  const googlePreparing = readiness?.wallets?.google?.state === "preparing";
  const assetsTerminal = ASSET_GROUPS.every((types) => {
    const rows = types.map((type) => (assets || []).find((asset) => asset.assetType === type));
    const state = generatedAssetGroupState(assets, types);
    return state === "ready"
      || state === "failed"
      || (scheduleState === "failed_to_schedule" && rows.every((asset) => !asset));
  });
  return googlePreparing || !assetsTerminal;
}

export { ASSET_GROUPS };
