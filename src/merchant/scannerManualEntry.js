export function normalizeManualScanValue(value) {
  const text = String(value || "")
    .trim()
    .replace(/[\r\n\t]/g, "");

  if (/^[a-z0-9][a-z0-9_-]*(-[a-z0-9][a-z0-9_-]*)+$/i.test(text)) {
    return text.toLowerCase();
  }

  return text;
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
  if (payload?.ok !== true || !payload.customerPass || typeof payload.customerPass !== "object") {
    return null;
  }

  const pass = payload.customerPass;
  const hasIdentifier = Boolean(
    pass.customerId ||
      pass.customer?.id ||
      pass.passSerial ||
      pass.passSerialNumber ||
      pass.serialNumber ||
      pass.pass?.serialNumber ||
      pass.pass?.serial_number,
  );
  const hasCustomer = Boolean(
    pass.customerName || pass.customer?.name || pass.customer?.firstName,
  );
  const stamps =
    pass.currentStamps ??
    pass.stamps ??
    pass.stampCount ??
    pass.customer?.currentStamps ??
    pass.customer?.stamps ??
    pass.pass?.currentStamps ??
    pass.pass?.stamps;

  const hasStampCount = stamps !== null && stamps !== undefined && stamps !== "";

  return hasIdentifier && hasCustomer && hasStampCount && Number.isFinite(Number(stamps))
    ? pass
    : null;
}
