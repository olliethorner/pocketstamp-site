const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

function isValidHexColor(value) {
  return hexColorPattern.test(String(value || ""));
}

function clamp(value, min = 0, max = 255) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function hexToRgb(value) {
  if (!isValidHexColor(value)) return null;
  const hex = String(value).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((channel) => Math.round(clamp(channel)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixHex(hex, targetHex, amount) {
  const base = hexToRgb(hex);
  const target = hexToRgb(targetHex);
  if (!base || !target) return hex;
  return rgbToHex({
    r: base.r + (target.r - base.r) * amount,
    g: base.g + (target.g - base.g) * amount,
    b: base.b + (target.b - base.b) * amount,
  });
}

function darkenHex(hex, amount = 0.2) {
  return mixHex(hex, "#000000", amount);
}

function lightenHex(hex, amount = 0.2) {
  return mixHex(hex, "#ffffff", amount);
}

function desaturateHex(hex, amount = 0.25) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const gray = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
  return rgbToHex({
    r: rgb.r + (gray - rgb.r) * amount,
    g: rgb.g + (gray - rgb.g) * amount,
    b: rgb.b + (gray - rgb.b) * amount,
  });
}

function getRelativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function chooseReadableTextColor(backgroundHex) {
  return getRelativeLuminance(backgroundHex) > 0.48 ? "#26211d" : "#ffffff";
}

function getThemeAccent(form = {}) {
  return [form.passAccentColor, form.brandColor, "#143d3b"].find(isValidHexColor) || "#143d3b";
}

export function getThemePreset(themeMode, currentForm = {}) {
  const accentColor = getThemeAccent(currentForm);

  if (themeMode === "custom") {
    return { passThemeMode: "custom" };
  }

  if (themeMode === "light_clean") {
    return {
      passThemeMode: themeMode,
      backgroundColor: "#fff8ea",
      foregroundColor: "#26211d",
      textColor: "#26211d",
      labelColor: "#6f675d",
      passAccentColor: accentColor,
      passStampFilledColor: accentColor,
      passStampEmptyColor: "#ffffff",
      passLogoTileEnabled: true,
      passLogoTileColor: "#ffffff",
      passLogoFit: "contain",
    };
  }

  if (themeMode === "brand_bold") {
    const backgroundColor = accentColor;
    const foregroundColor = chooseReadableTextColor(backgroundColor);
    const darkBackground = foregroundColor === "#ffffff";
    return {
      passThemeMode: themeMode,
      backgroundColor,
      foregroundColor,
      textColor: foregroundColor,
      labelColor: darkBackground ? "#f5f2ea" : "#6f675d",
      passAccentColor: accentColor,
      passStampFilledColor: darkBackground ? lightenHex(accentColor, 0.55) : darkenHex(accentColor, 0.2),
      passStampEmptyColor: darkBackground ? "#ffffff" : "#f5f2ea",
      passLogoTileEnabled: true,
      passLogoTileColor: "#ffffff",
      passLogoFit: "contain",
    };
  }

  const backgroundColor = darkenHex(desaturateHex(accentColor, 0.3), 0.55);
  return {
    passThemeMode: "premium_dark",
    backgroundColor,
    foregroundColor: "#ffffff",
    textColor: "#ffffff",
    labelColor: "#f5f2ea",
    passAccentColor: accentColor,
    passStampFilledColor: accentColor,
    passStampEmptyColor: "#f5f2ea",
    passLogoTileEnabled: true,
    passLogoTileColor: "#ffffff",
    passLogoFit: "contain",
  };
}

export function applyWalletThemePreset(currentForm = {}, themeMode) {
  const next = { ...currentForm, passThemeMode: themeMode };
  return { ...next, ...getThemePreset(themeMode, next) };
}

function firstSuggested(suggestions, ...fields) {
  return fields.map((field) => suggestions?.[field]).find((value) => value !== undefined && value !== null && value !== "");
}

export function applyWalletColorSuggestions(currentForm = {}, suggestions = null) {
  if (!suggestions) return currentForm;

  const accentColor = firstSuggested(suggestions, "passAccentColor", "accentColor", "brandColor") || currentForm.passAccentColor;
  const baseForm = {
    ...currentForm,
    brandColor: suggestions.brandColor || currentForm.brandColor,
    passAccentColor: accentColor,
  };
  const preset = getThemePreset(baseForm.passThemeMode, baseForm);
  const textColor = firstSuggested(suggestions, "foregroundColor", "textColor") || preset.foregroundColor || currentForm.foregroundColor || currentForm.textColor;

  return {
    ...baseForm,
    ...preset,
    backgroundColor: suggestions.backgroundColor || preset.backgroundColor || currentForm.backgroundColor,
    foregroundColor: textColor,
    textColor,
    labelColor: suggestions.labelColor || preset.labelColor || currentForm.labelColor,
    passStampFilledColor: firstSuggested(suggestions, "passStampFilledColor", "stampFilledColor") || preset.passStampFilledColor || currentForm.passStampFilledColor,
    passStampEmptyColor: firstSuggested(suggestions, "passStampEmptyColor", "stampEmptyColor") || preset.passStampEmptyColor || currentForm.passStampEmptyColor,
    passLogoTileColor: firstSuggested(suggestions, "passLogoTileColor", "logoTileColor") || preset.passLogoTileColor || currentForm.passLogoTileColor,
  };
}

export function getWalletDraftColorValue(form = {}, field) {
  return form[field];
}

export function buildMerchantEditPatchPayload(form = {}) {
  return {
    ...form,
    rewardThreshold: form.rewardThreshold ? Number(form.rewardThreshold) : undefined,
  };
}
