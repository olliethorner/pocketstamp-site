export const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export function isValidRequestId(value) {
  return typeof value === "string" && REQUEST_ID_PATTERN.test(value);
}

function randomUuidFromValues(cryptoObject) {
  const bytes = new Uint8Array(16);
  cryptoObject.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

export function createRequestId(namespace, cryptoObject = globalThis.crypto) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(namespace || "")) {
    throw new TypeError("requestId namespace contains unsupported characters");
  }
  if (!cryptoObject) throw new Error("Secure crypto is unavailable");

  const uuid = typeof cryptoObject.randomUUID === "function"
    ? cryptoObject.randomUUID()
    : randomUuidFromValues(cryptoObject);
  const requestId = `${namespace}.${uuid}`;

  if (!isValidRequestId(requestId)) throw new Error("Generated an invalid requestId");
  return requestId;
}

export function getOrCreateActionRequest(current, namespace, actionKey, cryptoObject) {
  if (current?.actionKey === actionKey && isValidRequestId(current.requestId)) return current;
  return { actionKey, requestId: createRequestId(namespace, cryptoObject) };
}

// A response status means the server definitively answered, even when it rejected the request.
export function isAmbiguousMutationFailure(error) {
  return !Number.isInteger(error?.status);
}
