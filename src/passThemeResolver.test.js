import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPassThemeResolverPayload,
  extractResolvedPassTheme,
  requestPassThemeResolution,
} from "./passThemeResolver.js";

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
