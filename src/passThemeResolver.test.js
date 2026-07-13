import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPassThemeResolverPayload,
  extractResolvedPassTheme,
  getWalletThemeDisplayForm,
  requestPassThemeResolution,
} from "./passThemeResolver.js";

const originalForm = {
  passThemeMode: "custom",
  passAccentColor: "#111111",
  backgroundColor: "#222222",
  foregroundColor: "#333333",
  textColor: "#333333",
  labelColor: "#444444",
  passStampFilledColor: "#555555",
  passStampEmptyColor: "#666666",
};

const resolvedPresets = {
  brand_bold: {
    accentColor: "#a02030",
    finalBackgroundColor: "#a02030",
    finalForegroundColor: "#ffffff",
    finalLabelColor: "#f5f2ea",
    stampFilledColor: "#d68f99",
    stampEmptyColor: "#ffffff",
  },
  light_clean: {
    accentColor: "#a02030",
    finalBackgroundColor: "#fff8ea",
    finalForegroundColor: "#26211d",
    finalLabelColor: "#6f675d",
    stampFilledColor: "#a02030",
    stampEmptyColor: "#ffffff",
  },
  premium_dark: {
    accentColor: "#a02030",
    finalBackgroundColor: "#391d22",
    finalForegroundColor: "#ffffff",
    finalLabelColor: "#f5f2ea",
    stampFilledColor: "#a02030",
    stampEmptyColor: "#f5f2ea",
  },
};

for (const [mode, resolvedTheme] of Object.entries(resolvedPresets)) {
  test(`${mode} displays all six authoritative colour values without changing the draft`, () => {
    const draft = { ...originalForm, passThemeMode: mode };
    const display = getWalletThemeDisplayForm(draft, resolvedTheme, "resolved");

    assert.deepEqual({
      passAccentColor: display.passAccentColor,
      backgroundColor: display.backgroundColor,
      foregroundColor: display.foregroundColor,
      labelColor: display.labelColor,
      passStampFilledColor: display.passStampFilledColor,
      passStampEmptyColor: display.passStampEmptyColor,
    }, {
      passAccentColor: resolvedTheme.accentColor,
      backgroundColor: resolvedTheme.finalBackgroundColor,
      foregroundColor: resolvedTheme.finalForegroundColor,
      labelColor: resolvedTheme.finalLabelColor,
      passStampFilledColor: resolvedTheme.stampFilledColor,
      passStampEmptyColor: resolvedTheme.stampEmptyColor,
    });
    assert.deepEqual(draft, { ...originalForm, passThemeMode: mode });
  });
}

test("a pending manual colour edit is displayed and retained in the save draft", () => {
  const draft = { ...originalForm, passThemeMode: "brand_bold", backgroundColor: "#abcdef" };
  const display = getWalletThemeDisplayForm(draft, resolvedPresets.brand_bold, "updating");

  assert.strictEqual(display, draft);
  assert.equal(display.backgroundColor, "#abcdef");
});

test("display projection leaves save and cancel state unchanged", () => {
  const saved = { ...originalForm };
  const draft = { ...saved, passThemeMode: "premium_dark" };
  const display = getWalletThemeDisplayForm(draft, resolvedPresets.premium_dark, "resolved");

  assert.notStrictEqual(display, draft);
  assert.deepEqual(draft, { ...saved, passThemeMode: "premium_dark" });
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
      passAccentColor: "#ffcc00",
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
    accentColor: "#ffcc00",
  });
});

test("an incomplete response is not presented as authoritative", () => {
  assert.equal(extractResolvedPassTheme({ result: { backgroundColor: "#101820" } }), null);
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

  const resolved = await requestPassThemeResolution(adminRequest, "admin-access-token", {
    passThemeMode: "brand_bold",
    cafeName: "Must not be sent",
  });

  assert.equal(resolved.finalBackgroundColor, "#101820");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "/api/admin/resolve-pass-theme");
  assert.equal(calls[0][1].method, "POST");
  assert.equal(calls[0][2], "admin-access-token");
  assert.deepEqual(JSON.parse(calls[0][1].body), buildPassThemeResolverPayload({ passThemeMode: "brand_bold" }));
});
