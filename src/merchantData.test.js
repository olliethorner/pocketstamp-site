import assert from "node:assert/strict";
import test from "node:test";
import {
  extractAccessToken,
  getBirthdayRewardsSetting,
  normalizeMerchantContext,
} from "./merchant/utils/merchantData.js";

test("normalizes the existing merchant context response variants", () => {
  const payload = {
    user: { email: "owner@example.com", role: "owner" },
    merchantContext: {
      id: "merchant_1",
      displayName: "Test Café",
      slug: "test-cafe",
      location: { id: "location_1", name: "High Street" },
      loyalty: { birthday_rewards_enabled: true },
      customerCount: 42,
    },
  };

  const context = normalizeMerchantContext(payload);

  assert.equal(context.merchantId, "merchant_1");
  assert.equal(context.merchantName, "Test Café");
  assert.equal(context.merchantSlug, "test-cafe");
  assert.equal(context.locationId, "location_1");
  assert.equal(context.locationName, "High Street");
  assert.equal(context.role, "owner");
  assert.equal(context.email, "owner@example.com");
  assert.equal(context.totalCustomers, 42);
  assert.equal(context.birthdayRewardsEnabled, true);
  assert.equal(context.raw, payload);
});

test("retains the existing birthday setting precedence", () => {
  assert.equal(
    getBirthdayRewardsSetting({
      birthday_rewards_enabled: false,
      loyalty: { birthdayRewardsEnabled: true },
    }),
    false,
  );
});

test("extracts supported existing access token shapes", () => {
  assert.equal(
    extractAccessToken({ data: { session: { accessToken: "token_1" } } }),
    "token_1",
  );
  assert.equal(extractAccessToken({ jwt: "token_2" }), "token_2");
});
