# Merchant dashboard release readiness

## Automated verification

- Merchant route resolution is covered by focused tests.
- Route-aware dataset selection is covered by focused tests.
- Merchant context and access-token response normalization are covered by
  focused tests.
- Customer, activity, reminder, campaign, and join-link presentation rules
  are covered by pure tests.
- The production build and development transforms are required release
  checks.

## Manual checks requiring real accounts or hardware

- Successful login against production authentication.
- Session restoration and expired-token handling against the live backend.
- Owner, manager, staff, and location-scoped campaign permissions.
- Merchant data isolation between two real merchant accounts.
- Scanner device-token connection.
- USB scanner input, camera permission/scanning, manual lookup, stamp
  adjustment, redemption, undo, and recent scanner activity.
- Clipboard permission and opening a real merchant join page.
- Apple Wallet QR scanning on representative counter hardware.

## Responsive matrix

Review all five management pages at:

- Small phone: 320–375 px
- Large phone: 390–430 px
- Portrait tablet: 768–834 px
- Landscape tablet: 1024–1194 px
- Desktop: 1280–1440 px
- Wide desktop: 1600 px and above

Confirm the mobile menu, touch targets, QR readability, customer expansion,
campaign date/time input, activity filters, and scanner action at each
relevant breakpoint.

## Release decision rule

The frontend may enter controlled merchant testing after automated checks
pass. Controlled production use additionally requires successful manual
authentication, merchant isolation, campaign-permission, and Scanner Mode
checks with real accounts and hardware.
