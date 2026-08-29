# POS compatibility backend contract

The frontend route `/admin/pos-compatibility` uses the existing Supabase admin session and `VITE_POCKETSTAMP_BACKEND_URL`. These endpoints belong in the private PocketStamp backend repository; this website repository does not contain that service or its migration system.

## Authenticated endpoints

- `GET /api/admin/pos-compatibility` — active records only; return `{ "ok": true, "records": [...] }`.
- `POST /api/admin/pos-compatibility` — create one record; only `name` is required.
- `PATCH /api/admin/pos-compatibility/:id` — update allow-listed fields.
- `POST /api/admin/pos-compatibility/:id/archive` — set `archived_at`; never hard-delete.

All routes must use the same active owner/sales-admin middleware as `/api/admin/merchants`. They must never be mounted beneath a public or merchant router. Because the current admin role model already limits this portal to internal admins, both active admin roles can read and write records; owner-only access would unnecessarily prevent sales staff from recording café visits.

## Additive table

Create `pos_compatibility_records` using the backend's normal UUID/timestamp conventions with: `id`, `name`, `vendor`, nullable `website_url`, `typical_hardware`, `operating_system`, `native_scanner_status`, `api_status`, `preferred_pocketstamp_route`, `physical_test_status`, `priority`, non-negative integer `cafes_seen`, `notes`, `next_action`, nullable `last_researched_at`, nullable `archived_at`, `created_at`, and `updated_at`.

Allowed enums are defined in [src/posCompatibility.js](../src/posCompatibility.js). Enforce them with database constraints and request validation. Also enforce `cafes_seen >= 0`; name 1–120 characters; vendor 120; website URL 500; hardware 500; OS 240; notes 5,000; next action 2,000. Reject unknown request keys and use parameterized queries.

## Idempotent seed

The migration should upsert or insert-on-conflict by a case-insensitive unique name. Seed Square and Sharp with `cafes_seen = 1`; SumUp, Epos Now, and Lightspeed with `0`. Use the conservative statuses and exact notes/actions from the product brief: no row is ready or passed, physical testing is `not_tested`, routes are `undecided`, and APIs are `researching` or `unknown`. Set Square high priority and the other four medium. Do not set `last_researched_at` to the migration date, because that would imply research occurred then.

Mutation request bodies use the frontend's canonical camelCase field names: `name`, `vendor`, `websiteUrl`, `typicalHardware`, `operatingSystem`, `nativeScannerStatus`, `apiStatus`, `preferredPocketstampRoute`, `physicalTestStatus`, `priority`, `cafesSeen`, `notes`, `nextAction`, and `lastResearchedAt`. Unknown keys are rejected. Optional blank text is stored as null, `cafesSeen` defaults to `0`, enum fields use the defaults in `EMPTY_POS_RECORD`, and `lastResearchedAt` accepts an ISO date or date/time and defaults to null.

Database rows and API response records use snake_case. The frontend normalizes those records explicitly. Create, update, and archive return `{ "ok": true, "record": {...} }`. Errors return a non-2xx response with `{ "ok": false, "result": "...", "message": "..." }` and include `field` for validation errors.
