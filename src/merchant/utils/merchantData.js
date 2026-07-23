function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export function getBirthdayRewardsSetting(source = {}) {
  return pickFirst(
    source.birthdayRewardsEnabled,
    source.birthday_rewards_enabled,
    source.loyalty?.birthdayRewardsEnabled,
    source.loyalty?.birthday_rewards_enabled,
  );
}

export function normalizeMerchantContext(payload) {
  const source =
    payload?.merchantContext ||
    payload?.context ||
    payload?.merchant ||
    payload?.user?.merchant ||
    payload?.data?.merchantContext ||
    payload?.data?.merchant ||
    payload ||
    {};

  const user = payload?.user || payload?.data?.user || source?.user || {};
  const location =
    source?.location ||
    source?.merchantLocation ||
    source?.locations?.[0] ||
    payload?.location ||
    {};

  return {
    raw: payload,
    merchantId: pickFirst(source.merchantId, source.id, source._id, payload?.merchantId),
    merchantName: pickFirst(
      source.merchantName,
      source.name,
      source.displayName,
      source.businessName,
      payload?.merchantName,
      "PocketStamp merchant",
    ),
    merchantSlug: pickFirst(source.merchantSlug, source.slug, payload?.merchantSlug),
    locationId:
      source.locationId !== undefined
        ? source.locationId
        : location.id ?? payload?.locationId,
    locationName:
      source.locationName !== undefined
        ? source.locationName
        : pickFirst(
            location.name,
            location.displayName,
            payload?.locationName,
            "Primary location",
          ),
    role: pickFirst(source.role, user.role, payload?.role, "Merchant"),
    email: pickFirst(user.email, source.email, payload?.email),
    totalCustomers: pickFirst(source.totalCustomers, source.customerCount),
    birthdayRewardsEnabled: getBirthdayRewardsSetting({ ...payload, ...source }),
  };
}

export function extractAccessToken(payload) {
  return pickFirst(
    payload?.session?.accessToken,
    payload?.accessToken,
    payload?.token,
    payload?.jwt,
    payload?.data?.session?.accessToken,
    payload?.data?.accessToken,
    payload?.data?.token,
  );
}
