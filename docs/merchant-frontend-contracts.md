# Merchant frontend contracts

This audit records the response fields consumed by the frontend before the
merchant dashboard redesign. It describes the existing client contract only;
the backend implementation is not part of this repository.

## Authentication and merchant context

### `GET /api/auth/me`

The frontend accepts merchant context from `merchantContext`, `context`,
`merchant`, `user.merchant`, `data.merchantContext`, or `data.merchant`.

Consumed merchant fields:

- Identity: `merchantId`, `id`, `_id`
- Display name: `merchantName`, `name`, `displayName`, `businessName`
- Public slug: `merchantSlug`, `slug`
- Location: `locationId`, `locationName`, `location`,
  `merchantLocation`, or the first item in `locations`
- User: `user.email`, merchant `email`
- Role: merchant `role`, `user.role`
- Optional totals: `totalCustomers`, `customerCount`
- Birthday setting: `birthdayRewardsEnabled`, `birthday_rewards_enabled`,
  `loyalty.birthdayRewardsEnabled`, or
  `loyalty.birthday_rewards_enabled`

The raw payload is retained in the normalized context.

Session tokens returned by login/setup may be read from
`session.accessToken`, `accessToken`, `token`, `jwt`, or their supported
`data` variants. Authenticated calls use the bearer token. The frontend does
not send a merchant ID with normal merchant requests and therefore assumes
the backend scopes data from the authenticated session.

## `GET /api/merchant/dashboard/summary`

The dashboard reads the `summary` object.

Direct metric fields:

- `activeWalletCards`
- `customersJoined`
- `stampsToday`
- `rewardsRedeemed`
- Birthday reward setting variants listed above

Scanner data is accepted from `scanner`, `scannerMode`, `scannerStatus`,
`scannerDevice`, `device`, the first `devices` item, the first
`scannerDevices` item, or `counterScanner`.

Scanner fields consumed include:

- Availability: `hasScannerDevices`
- State: `ready`, `isReady`, `enabled`, `isEnabled`, `configured`,
  `isConfigured`
- Launch URL: `scannerUrl`, `scannerURL`, `kioskUrl`, `kioskURL`, `url`
- Device label: `deviceName`, `name`, `label`
- Mode: `mode`, `scannerMode`
- Cooldown: `cooldownSeconds`, `stampCooldownSeconds`
- Reward confirmation: `rewardConfirmationRequired`,
  `requiresRewardConfirmation`
- Last scan: `lastScanAt`, `lastScan.createdAt`

Current assumptions:

- The periods for `activeWalletCards`, `customersJoined`, and
  `rewardsRedeemed` are not defined by the frontend.
- `stampsToday` is assumed to use the relevant merchant day/timezone.
- Any scanner URL or positive readiness/configuration field means ready.
- When no scanner data exists, the UI falls back to “Available” and says
  setup is managed by PocketStamp; this does not prove a device exists.

## `GET /api/merchant/activity?limit=10`

Rows may be returned as the root array or under `activity`, `activities`,
`events`, `items`, or supported `data` variants.

Consumed row fields include:

- ID: `id`, `_id`, `eventId`
- Type/classification: `type`, `eventType`, `action`, `event`, `kind`,
  `result`, `status`, reward fields, `title`, `description`, `message`
- Time: `timestamp`, `createdAt`, `created_at`, `occurredAt`, `scannedAt`,
  `updatedAt`, `date`
- Customer identity: `customerName`, `customer_name`, `name`, and nested
  customer name fields
- Detail fields used by activity title/detail formatting, including stamp,
  reward, reminder, join, Wallet, scanner, and location variants

Current assumptions:

- Only ten rows are requested.
- “Today”, “7 days”, “30 days”, and “All” filter those ten rows in the
  browser; they are not complete historical queries.
- Event type is inferred from flexible text matching rather than a single
  documented enum.

## `GET /api/merchant/customers`

The request sends `limit=50`, a backend `status`, and an optional `search`.
Rows may be returned as the root array or under `customers`, `items`, or
supported `data` variants.

Consumed customer fields include:

- Customer ID variants
- Name and email variants
- Current stamps and reward-threshold variants
- Reward-ready and progress/status variants
- Join, update, and last-activity timestamps
- Wallet/card state and card identifier variants
- Birthday month/day and birthday setting variants
- Scan-today booleans/timestamps

Current assumptions:

- The returned array is treated as the complete result set and paginated in
  the browser ten at a time.
- The displayed “of N customers” total is the returned row count, not a
  server-provided total.
- Results beyond the requested 50 cannot be reached.
- `scanned_today` is applied in the browser after requesting backend status
  `all`.
- Search is sent on every input change without debounce.

## `GET /api/merchant/reminders/summary`

Consumed fields:

- `summary.sentThisMonth`
- `summary.scheduled`

The overall Active badge and the Halfway, Almost there, Reward ready, and
Win-back statuses are hard-coded in the current UI. Birthday status comes
from the merchant/dashboard birthday setting. The current UI therefore does
not prove per-reminder operational state.

## `GET /api/merchant/campaigns`

The response may be a root array or `campaigns`.

Consumed fields:

- `id`
- `message`
- `scheduledAt`
- `status`
- `deliveredCount`

Known statuses are `scheduled`, `processing`, `sent`, `partially_failed`,
`failed`, and `cancelled`. Campaign management is shown only when the
normalized role is exactly `owner` or `manager` and `locationId === null`.
This is a presentation rule; backend authorization is still required.

## Cross-cutting assumptions

- All ordinary merchant endpoints are assumed to be tenant- and
  location-scoped by the bearer session.
- Dashboard data refreshes every 20 seconds while visible, on focus, on
  visibility restoration, and after same-tab/cross-tab merchant-data events.
- Summary, activity, reminders, customers, and campaigns keep independent
  loading/error state.
- The backend repository and authoritative response schemas are unavailable
  here, so metric definitions, timezone rules, total counts, and entitlement
  behavior must be confirmed before Stage 3 changes their presentation.
