export const PASS_THEME_RESOLVER_DEBOUNCE_MS = 300;

const supportedThemeFields = [
  "passThemeMode",
  "passAccentColor",
  "backgroundColor",
  "foregroundColor",
  "labelColor",
  "passStampEmptyColor",
  "passStampFilledColor",
  "passLogoTileEnabled",
  "passLogoTileColor",
  "passLogoFit",
];

const supportedThemeFieldSet = new Set(supportedThemeFields);

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export function buildPassThemeResolverPayload(form = {}) {
  return Object.fromEntries(
    supportedThemeFields
      .filter((field) => form[field] !== undefined)
      .map((field) => [field, form[field]]),
  );
}

export function isPassThemeResolverField(field) {
  return supportedThemeFieldSet.has(field);
}

export function isLatestPassThemeResolution(latestRequestId, requestId) {
  return latestRequestId === requestId;
}

export function transitionPassThemePreview(currentTheme, event = {}) {
  if (event.type === "reset") return null;
  if (event.type === "resolved" && event.theme) return event.theme;
  return currentTheme;
}

export async function requestPassThemeResolution(adminRequest, accessToken, form = {}) {
  const payload = await adminRequest("/api/admin/resolve-pass-theme", {
    method: "POST",
    body: JSON.stringify(buildPassThemeResolverPayload(form)),
  }, accessToken);
  return extractResolvedPassTheme(payload);
}

export function extractResolvedPassTheme(payload = {}) {
  const result = payload?.data?.result || payload?.result || payload?.data || payload;
  const theme = result?.finalTheme || result?.resolvedTheme || result?.theme || result;
  const finalBackgroundColor = firstDefined(theme?.finalBackgroundColor, theme?.backgroundColor);
  const finalForegroundColor = firstDefined(theme?.finalForegroundColor, theme?.foregroundColor, theme?.textColor);
  const finalLabelColor = firstDefined(theme?.finalLabelColor, theme?.labelColor);
  const stampFilledColor = firstDefined(theme?.finalStampFilledColor, theme?.stampFilledColor, theme?.passStampFilledColor);
  const stampEmptyColor = firstDefined(theme?.finalStampEmptyColor, theme?.stampEmptyColor, theme?.passStampEmptyColor);

  if (!finalBackgroundColor || !finalForegroundColor || !finalLabelColor || !stampFilledColor || !stampEmptyColor) {
    return null;
  }

  const warnings = firstDefined(
    theme?.themeWarnings,
    theme?.warnings,
    result?.themeWarnings,
    result?.warnings,
    payload?.themeWarnings,
    payload?.data?.themeWarnings,
  );

  return {
    ...(firstDefined(theme?.passThemeMode, theme?.themeMode) ? { passThemeMode: firstDefined(theme?.passThemeMode, theme?.themeMode) } : {}),
    ...(firstDefined(theme?.passAccentColor, theme?.accentColor) ? { passAccentColor: firstDefined(theme?.passAccentColor, theme?.accentColor) } : {}),
    finalBackgroundColor,
    finalForegroundColor,
    finalLabelColor,
    stampFilledColor,
    stampEmptyColor,
    logoTileEnabled: Boolean(firstDefined(theme?.logoTileEnabled, theme?.passLogoTileEnabled, false)),
    logoTileColor: firstDefined(theme?.logoTileColor, theme?.passLogoTileColor, "#ffffff"),
    logoFit: firstDefined(theme?.logoFit, theme?.passLogoFit, "contain"),
    ...(theme?.passThemeResolved !== undefined ? { passThemeResolved: Boolean(theme.passThemeResolved) } : {}),
    ...(theme?.passThemeResolutionVersion !== undefined ? { passThemeResolutionVersion: theme.passThemeResolutionVersion } : {}),
    themeWarnings: Array.isArray(warnings) ? warnings.filter(Boolean) : warnings ? [String(warnings)] : [],
  };
}

export function buildCanonicalPassThemeSubmission(theme = {}) {
  return {
    passThemeMode: theme.passThemeMode,
    passThemeResolved: theme.passThemeResolved,
    passThemeResolutionVersion: theme.passThemeResolutionVersion,
    passAccentColor: theme.passAccentColor,
    backgroundColor: theme.finalBackgroundColor,
    foregroundColor: theme.finalForegroundColor,
    textColor: theme.finalForegroundColor,
    labelColor: theme.finalLabelColor,
    passStampFilledColor: theme.stampFilledColor,
    passStampEmptyColor: theme.stampEmptyColor,
    passLogoTileEnabled: theme.logoTileEnabled,
    passLogoTileColor: theme.logoTileColor,
    passLogoFit: theme.logoFit,
  };
}
