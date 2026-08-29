export const NATIVE_SCANNER_STATUSES = ["ready", "physically_tested", "likely_compatible", "needs_testing", "not_compatible", "not_applicable", "unknown"];
export const API_STATUSES = ["strong_opportunity", "researching", "limited", "none_known", "unknown"];
export const POCKETSTAMP_ROUTES = ["native_scanner", "direct_pos_api", "standalone_hardware", "hybrid", "undecided"];
export const PHYSICAL_TEST_STATUSES = ["not_tested", "partial", "passed", "failed"];
export const PRIORITIES = ["high", "medium", "low"];

export const EMPTY_POS_RECORD = {
  name: "", vendor: "", websiteUrl: "", typicalHardware: "", operatingSystem: "",
  nativeScannerStatus: "unknown", apiStatus: "unknown", preferredPocketstampRoute: "undecided",
  physicalTestStatus: "not_tested", priority: "medium", cafesSeen: 0, notes: "", nextAction: "",
  lastResearchedAt: "",
};

const labels = {
  ready: "Ready", physically_tested: "Physically tested", likely_compatible: "Likely compatible",
  needs_testing: "Needs testing", not_compatible: "Not compatible", not_applicable: "Not applicable",
  unknown: "Unknown", strong_opportunity: "Strong opportunity", researching: "Researching",
  limited: "Limited", none_known: "None known", native_scanner: "Native scanner",
  direct_pos_api: "Direct POS / API", standalone_hardware: "Standalone hardware", hybrid: "Hybrid",
  undecided: "Undecided", not_tested: "Not tested", partial: "Partial", passed: "Passed",
  failed: "Failed", high: "High", medium: "Medium", low: "Low",
};

export function statusLabel(value) {
  return labels[value] || String(value || "Unknown").replaceAll("_", " ");
}

export function normalizePosRecord(source = {}) {
  return {
    ...EMPTY_POS_RECORD,
    ...source,
    websiteUrl: source.websiteUrl ?? source.website_url ?? "",
    typicalHardware: source.typicalHardware ?? source.typical_hardware ?? "",
    operatingSystem: source.operatingSystem ?? source.operating_system ?? "",
    nativeScannerStatus: source.nativeScannerStatus ?? source.native_scanner_status ?? "unknown",
    apiStatus: source.apiStatus ?? source.api_status ?? "unknown",
    preferredPocketstampRoute: source.preferredPocketstampRoute ?? source.preferred_pocketstamp_route ?? "undecided",
    physicalTestStatus: source.physicalTestStatus ?? source.physical_test_status ?? "not_tested",
    cafesSeen: Number(source.cafesSeen ?? source.cafes_seen ?? 0),
    nextAction: source.nextAction ?? source.next_action ?? "",
    lastResearchedAt: source.lastResearchedAt ?? source.last_researched_at ?? "",
    updatedAt: source.updatedAt ?? source.updated_at ?? "",
    archivedAt: source.archivedAt ?? source.archived_at ?? null,
  };
}

export function extractPosRecords(payload) {
  const records = payload?.posCompatibility ?? payload?.records ?? payload?.data ?? payload;
  return Array.isArray(records) ? records.map(normalizePosRecord) : [];
}

export function buildPosMutationPayload(record = {}) {
  return {
    name: String(record.name || "").trim(),
    vendor: String(record.vendor || ""),
    websiteUrl: String(record.websiteUrl || ""),
    typicalHardware: String(record.typicalHardware || ""),
    operatingSystem: String(record.operatingSystem || ""),
    nativeScannerStatus: record.nativeScannerStatus,
    apiStatus: record.apiStatus,
    preferredPocketstampRoute: record.preferredPocketstampRoute,
    physicalTestStatus: record.physicalTestStatus,
    priority: record.priority,
    cafesSeen: Math.max(0, Math.trunc(Number(record.cafesSeen) || 0)),
    notes: String(record.notes || ""),
    nextAction: String(record.nextAction || ""),
    lastResearchedAt: record.lastResearchedAt || null,
  };
}

export function posSummary(records) {
  return {
    total: records.length,
    scannerReady: records.filter((r) => ["ready", "physically_tested"].includes(r.nativeScannerStatus) && r.physicalTestStatus === "passed").length,
    needsTesting: records.filter((r) => r.nativeScannerStatus === "needs_testing" || ["not_tested", "partial"].includes(r.physicalTestStatus)).length,
    apiOpportunities: records.filter((r) => r.apiStatus === "strong_opportunity").length,
    standalone: records.filter((r) => r.preferredPocketstampRoute === "standalone_hardware").length,
    sightings: records.reduce((sum, record) => sum + Math.max(0, Number(record.cafesSeen) || 0), 0),
  };
}
