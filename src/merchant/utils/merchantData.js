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
  const merchantSlug = pickFirst(
    source.merchantSlug,
    source.merchant_slug,
    source.slug,
    source.merchant?.merchantSlug,
    source.merchant?.merchant_slug,
    source.merchant?.slug,
    payload?.merchantSlug,
    payload?.merchant_slug,
    payload?.merchant?.merchantSlug,
    payload?.merchant?.merchant_slug,
    payload?.merchant?.slug,
    payload?.user?.merchantSlug,
    payload?.user?.merchant_slug,
    payload?.user?.merchant?.merchantSlug,
    payload?.user?.merchant?.merchant_slug,
    payload?.user?.merchant?.slug,
    payload?.data?.merchantSlug,
    payload?.data?.merchant_slug,
    payload?.data?.merchant?.merchantSlug,
    payload?.data?.merchant?.merchant_slug,
    payload?.data?.merchant?.slug,
    payload?.data?.user?.merchantSlug,
    payload?.data?.user?.merchant_slug,
    payload?.data?.user?.merchant?.merchantSlug,
    payload?.data?.user?.merchant?.merchant_slug,
    payload?.data?.user?.merchant?.slug,
    payload?.result?.merchantSlug,
    payload?.result?.merchant_slug,
    payload?.result?.merchant?.merchantSlug,
    payload?.result?.merchant?.merchant_slug,
    payload?.result?.merchant?.slug,
    payload?.data?.result?.merchantSlug,
    payload?.data?.result?.merchant_slug,
    payload?.data?.result?.merchant?.merchantSlug,
    payload?.data?.result?.merchant?.merchant_slug,
    payload?.data?.result?.merchant?.slug,
  );

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
    merchantSlug,
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
    name: pickFirst(source.name, user.name, payload?.name),
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

export function normalizeMerchantSession(payload) {
  const session = payload?.session || payload?.data?.session || {};
  const accessToken = extractAccessToken(payload);
  if (!accessToken) return null;
  return {
    accessToken,
    refreshToken: session.refreshToken || session.refresh_token || null,
    expiresAt: Date.now() + Number(session.expiresIn || session.expires_in || 3600) * 1000,
  };
}
