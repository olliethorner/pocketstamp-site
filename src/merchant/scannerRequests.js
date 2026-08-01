export function buildScannerScanRequest({ deviceToken, scanValue, requestId }) {
  return { deviceToken, scanValue, requestId };
}

export function buildScannerLookupRequest({ deviceToken, scanValue, pass = {} }) {
  return {
    deviceToken,
    ...(scanValue ? { scanValue } : {}),
    ...pass,
  };
}

export function buildScannerAdjustmentRequest({ deviceToken, stamps, note, requestId, pass = {} }) {
  return {
    deviceToken,
    stamps,
    stampCount: stamps,
    currentStamps: stamps,
    requestId,
    ...(note ? { note, reason: note } : {}),
    ...pass,
  };
}

export function buildScannerRedemptionRequest({ action = {}, requestId }) {
  return { ...action, requestId };
}

export function buildScannerUndoRequest({ action = {} }) {
  return action;
}
