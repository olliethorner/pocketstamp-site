export function normalizeManualScanValue(value) {
  return String(value || "")
    .trim()
    .replace(/[\r\n\t]/g, "");
}

export function applyManualPaste(currentValue, pastedValue, selectionStart, selectionEnd) {
  const current = String(currentValue || "");
  const start = Number.isInteger(selectionStart) ? selectionStart : current.length;
  const end = Number.isInteger(selectionEnd) ? selectionEnd : start;
  return `${current.slice(0, start)}${String(pastedValue || "")}${current.slice(end)}`;
}

export function sanitizeScannerMessage(message) {
  return String(message || "Please try again.").replace(/\bpsm_[a-z0-9_-]+\b/gi, "pass code");
}

export function getSuccessfulCustomerPass(payload) {
  if (payload?.ok !== true) return null;

  const source = payload.customerPass && typeof payload.customerPass === "object"
    ? payload.customerPass
    : payload;
  const customerName = source.customerName ?? source.customer?.name;
  const customerId = source.customerId ?? source.customer?.id;
  const serial = source.passSerial ?? source.passSerialNumber ?? source.serialNumber;
  const hasText = (value) => typeof value === "string" && value.trim().length > 0;
  const isFiniteValue = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

  if (
    !hasText(customerName) ||
    !hasText(customerId) ||
    !hasText(serial) ||
    !isFiniteValue(source.stamps) ||
    !isFiniteValue(source.rewardThreshold)
  ) {
    return null;
  }

  return {
    customerName,
    customerEmail: source.customerEmail,
    customerId,
    passSerial: source.passSerial ?? serial,
    passSerialNumber: source.passSerialNumber ?? serial,
    serialNumber: source.serialNumber ?? serial,
    passId: source.passId,
    stamps: source.stamps,
    rewardThreshold: source.rewardThreshold,
    rewardReady: source.rewardReady,
    merchantId: source.merchantId,
    lastActivityAt: source.lastActivityAt,
  };
}
