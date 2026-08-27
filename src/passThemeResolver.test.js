import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCanonicalPassThemeSubmission,
  buildPassThemeResolverPayload,
  extractResolvedPassTheme,
  isLatestPassThemeResolution,
  requestPassThemeResolution,
  transitionPassThemePreview,
} from "./passThemeResolver.js";

test("canonical onboarding submission uses the exact resolved preview values", () => {
  assert.deepEqual(buildCanonicalPassThemeSubmission({ passThemeMode: "brand_bold", passThemeResolved: true, passThemeResolutionVersion: 1, passAccentColor: "rgb(1, 2, 3)", finalBackgroundColor: "rgb(4, 5, 6)", finalForegroundColor: "rgb(7, 8, 9)", finalLabelColor: "rgb(10, 11, 12)", stampFilledColor: "rgb(13, 14, 15)", stampEmptyColor: "rgb(16, 17, 18)", logoTileEnabled: false, logoTileColor: "rgb(19, 20, 21)", logoFit: "cover" }), { passThemeMode: "brand_bold", passThemeResolved: true, passThemeResolutionVersion: 1, passAccentColor: "rgb(1, 2, 3)", backgroundColor: "rgb(4, 5, 6)", foregroundColor: "rgb(7, 8, 9)", textColor: "rgb(7, 8, 9)", labelColor: "rgb(10, 11, 12)", passStampFilledColor: "rgb(13, 14, 15)", passStampEmptyColor: "rgb(16, 17, 18)", passLogoTileEnabled: false, passLogoTileColor: "rgb(19, 20, 21)", passLogoFit: "cover" });
});
import {
  applyWalletColorSuggestions,
  applyWalletThemePreset,
  buildMerchantEditPatchPayload,
  getWalletDraftColorValue,
} from "./walletThemeDraft.js";

const originalForm = {
  passThemeMode: "custom",
  passAccentColor: "#111111",
  backgroundColor: "#222222",
  foregroundColor: "#333333",
  textColor: "#333333",
  labelColor: "#444444",
  passStampFilledColor: "#555555",
  passStampEmptyColor: "#666666",
  passLogoTileColor: "#777777",
};

test("all seven controls read their distinct raw draft fields without resolved fallbacks", () => {
  const fields = [
    "passAccentColor",
    "backgroundColor",
    "foregroundColor",
    "labelColor",
    "passStampFilledColor",
    "passStampEmptyColor",
    "passLogoTileColor",
  ];

  assert.deepEqual(fields.map((field) => getWalletDraftColorValue(originalForm, field)), [
    "#111111",
    "#222222",
    "#333333",
    "#444444",
    "#555555",
    "#666666",
    "#777777",
  ]);
  assert.equal(getWalletDraftColorValue(originalForm, "backgroundColor"), "#222222");
  assert.notEqual(getWalletDraftColorValue(originalForm, "backgroundColor"), "rgb(17, 14, 11)");
});

test("logo suggestions do not change the draft before Apply", () => {
  const draft = { ...originalForm, colorSuggestions: { brandColor: "#a02030" } };
  assert.deepEqual(draft, { ...originalForm, colorSuggestions: { brandColor: "#a02030" } });
});

test("logo suggestion Apply populates the complete raw Wallet palette", () => {
  const suggestions = {
    brandColor: "#a02030",
    backgroundColor: "#faf0e6",
    textColor: "#101820",
    labelColor: "#405060",
    passStampFilledColor: "#b03040",
    passStampEmptyColor: "#e0e0e0",
    passLogoTileColor: "#fefefe",
  };
  const applied = applyWalletColorSuggestions({ ...originalForm, passThemeMode: "light_clean" }, suggestions);

  assert.deepEqual({
    passAccentColor: applied.passAccentColor,
    backgroundColor: applied.backgroundColor,
    foregroundColor: applied.foregroundColor,
    textColor: applied.textColor,
    labelColor: applied.labelColor,
    passStampFilledColor: applied.passStampFilledColor,
    passStampEmptyColor: applied.passStampEmptyColor,
    passLogoTileColor: applied.passLogoTileColor,
  }, {
    passAccentColor: "#a02030",
    backgroundColor: "#faf0e6",
    foregroundColor: "#101820",
    textColor: "#101820",
    labelColor: "#405060",
    passStampFilledColor: "#b03040",
    passStampEmptyColor: "#e0e0e0",
    passLogoTileColor: "#fefefe",
  });
});

for (const mode of ["brand_bold", "light_clean", "premium_dark"]) {
  test(`${mode} populates raw suggested fields sent to the resolver`, () => {
    const draft = applyWalletThemePreset({ ...originalForm, passAccentColor: "#a02030" }, mode);
    const payload = buildPassThemeResolverPayload(draft);

    assert.equal(draft.passThemeMode, mode);
    assert.equal(draft.passAccentColor, "#a02030");
    assert.equal(payload.backgroundColor, draft.backgroundColor);
    assert.equal(payload.foregroundColor, draft.foregroundColor);
    assert.equal(payload.labelColor, draft.labelColor);
    assert.equal(payload.passStampFilledColor, draft.passStampFilledColor);
    assert.equal(payload.passStampEmptyColor, draft.passStampEmptyColor);
    assert.equal(payload.passLogoTileColor, draft.passLogoTileColor);
  });
}

test("manual edits remain the visible and saved raw value while resolution is pending", () => {
  const draft = { ...originalForm, backgroundColor: "#abcdef", passLogoTileColor: "#fedcba" };
  assert.equal(getWalletDraftColorValue(draft, "backgroundColor"), "#abcdef");
  assert.equal(getWalletDraftColorValue(draft, "passLogoTileColor"), "#fedcba");
});

test("Save payload contains exactly the raw values displayed by the controls", () => {
  const draft = {
    ...originalForm,
    rewardThreshold: "9",
    backgroundColor: "#abcdef",
    passLogoTileColor: "#fedcba",
  };
  const payload = buildMerchantEditPatchPayload(draft);

  assert.equal(payload.backgroundColor, getWalletDraftColorValue(draft, "backgroundColor"));
  assert.equal(payload.passLogoTileColor, getWalletDraftColorValue(draft, "passLogoTileColor"));
  assert.equal(payload.rewardThreshold, 9);
  assert.deepEqual(payload, { ...draft, rewardThreshold: 9 });
});

test("resolver output does not mutate input, save, or cancel draft values", () => {
  const saved = { ...originalForm };
  const draft = { ...saved, passThemeMode: "brand_bold", backgroundColor: "#abcdef" };
  const beforeResolution = { ...draft };
  const resolved = extractResolvedPassTheme({
    backgroundColor: "rgb(17, 14, 11)",
    foregroundColor: "rgb(17, 14, 11)",
    labelColor: "rgb(17, 14, 11)",
    stampFilledColor: "rgb(17, 14, 11)",
    stampEmptyColor: "rgb(17, 14, 11)",
  });

  assert.equal(resolved.finalForegroundColor, "rgb(17, 14, 11)");
  assert.deepEqual(draft, beforeResolution);
  assert.equal(getWalletDraftColorValue(draft, "backgroundColor"), "#abcdef");
  assert.deepEqual(saved, originalForm);
});

test("resolver payload includes only supported theme fields", () => {
  const payload = buildPassThemeResolverPayload({
    passThemeMode: "brand_bold",
    passAccentColor: "#112233",
    backgroundColor: "#223344",
    foregroundColor: "#ffffff",
    labelColor: "#eeeeee",
    passStampEmptyColor: "#dddddd",
    passStampFilledColor: "#334455",
    passLogoTileEnabled: true,
    passLogoTileColor: "#ffffff",
    passLogoFit: "contain",
    cafeName: "Must not be sent",
  });

  assert.deepEqual(Object.keys(payload), [
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
  ]);
  assert.equal(payload.passThemeMode, "brand_bold");
  assert.equal("cafeName" in payload, false);
});

test("resolver response normalizes authoritative colours, logo settings, and warnings", () => {
  const resolved = extractResolvedPassTheme({
    result: {
      backgroundColor: "#101820",
      foregroundColor: "#ffffff",
      labelColor: "#d9e2e8",
      stampFilledColor: "#ffcc00",
      stampEmptyColor: "#40505c",
      logoTileEnabled: false,
      logoTileColor: "#abcdef",
      logoFit: "cover",
      themeWarnings: ["Stamp colour was adjusted."],
    },
  });

  assert.deepEqual(resolved, {
    finalBackgroundColor: "#101820",
    finalForegroundColor: "#ffffff",
    finalLabelColor: "#d9e2e8",
    stampFilledColor: "#ffcc00",
    stampEmptyColor: "#40505c",
    logoTileEnabled: false,
    logoTileColor: "#abcdef",
    logoFit: "cover",
    themeWarnings: ["Stamp colour was adjusted."],
  });
});

test("an incomplete response is not presented as authoritative", () => {
  assert.equal(extractResolvedPassTheme({ result: { backgroundColor: "#101820" } }), null);
});

test("stale resolver responses remain rejected", () => {
  assert.equal(isLatestPassThemeResolution(4, 3), false);
  assert.equal(isLatestPassThemeResolution(4, 4), true);
});

test("pending resolution retains the last successful preview", () => {
  const previous = { finalBackgroundColor: "#112233" };
  assert.strictEqual(transitionPassThemePreview(previous, { type: "pending" }), previous);
});

test("the neutral fallback remains available before the first successful resolution", () => {
  assert.equal(transitionPassThemePreview(null, { type: "pending" }), null);
});

test("a newer successful resolution replaces the previous preview", () => {
  const previous = { finalBackgroundColor: "#112233" };
  const next = { finalBackgroundColor: "#445566" };
  assert.strictEqual(transitionPassThemePreview(previous, { type: "resolved", theme: next }), next);
});

test("a failed resolution retains the last successful preview", () => {
  const previous = { finalBackgroundColor: "#112233" };
  assert.strictEqual(transitionPassThemePreview(previous, { type: "failed" }), previous);
});

test("non-theme fields do not change the resolver payload", () => {
  const theme = { passThemeMode: "brand_bold", passAccentColor: "#112233" };
  assert.deepEqual(
    buildPassThemeResolverPayload({ ...theme, cafeName: "First café" }),
    buildPassThemeResolverPayload({ ...theme, cafeName: "Second café", rewardThreshold: 12 }),
  );
});

test("resolution uses the authenticated admin request mechanism", async () => {
  const calls = [];
  const adminRequest = async (...args) => {
    calls.push(args);
    return {
      backgroundColor: "#101820",
      foregroundColor: "#ffffff",
      labelColor: "#d9e2e8",
      stampFilledColor: "#ffcc00",
      stampEmptyColor: "#40505c",
    };
  };

  const draft = applyWalletThemePreset({
    ...originalForm,
    passAccentColor: "#a02030",
    cafeName: "Must not be sent",
  }, "brand_bold");
  const resolved = await requestPassThemeResolution(adminRequest, "admin-access-token", draft);

  assert.equal(resolved.finalBackgroundColor, "#101820");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "/api/admin/resolve-pass-theme");
  assert.equal(calls[0][1].method, "POST");
  assert.equal(calls[0][2], "admin-access-token");
  assert.deepEqual(JSON.parse(calls[0][1].body), buildPassThemeResolverPayload(draft));
  assert.equal(JSON.parse(calls[0][1].body).backgroundColor, draft.backgroundColor);
  assert.equal(JSON.parse(calls[0][1].body).passLogoTileColor, draft.passLogoTileColor);
});
