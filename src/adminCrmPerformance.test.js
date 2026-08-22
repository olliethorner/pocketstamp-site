import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clearAdminCrmCache,
  getAccountDetail,
  getAccountLists,
  getAccountSummary,
  prefetchAccountDetail,
  setAccountDetail,
  setAccountList,
} from "./adminCrmCache.js";

test("CRM cache retains list summaries and reconciles authoritative detail", () => {
  clearAdminCrmCache();
  setAccountList([{ id: "crm-1", name: "Before", stage: "lead" }], { archivedCount: 7 });
  assert.equal(getAccountLists().archivedCount, 7);
  assert.equal(getAccountSummary("crm-1").name, "Before");
  setAccountDetail("crm-1", { account: { id: "crm-1", name: "After", stage: "trial" } });
  assert.equal(getAccountDetail("crm-1").account.stage, "trial");
  assert.equal(getAccountSummary("crm-1").name, "After");
});

test("detail prefetch deduplicates simultaneous requests", async () => {
  clearAdminCrmCache();
  let calls = 0;
  const loader = async () => { calls += 1; return { account: { id: "crm-2" } }; };
  const [first, second] = await Promise.all([
    prefetchAccountDetail("crm-2", loader),
    prefetchAccountDetail("crm-2", loader),
  ]);
  assert.equal(calls, 1);
  assert.equal(first, second);
});

test("archive and restore reconcile cached lists and archived count", () => {
  clearAdminCrmCache();
  setAccountList([{ id: "crm-3", name: "Cafe", archived_at: null }], { archivedCount: 2 });
  setAccountList([], { archived: true });
  setAccountDetail("crm-3", { account: { id: "crm-3", archived_at: "2026-08-22T12:00:00Z" } });
  assert.equal(getAccountLists().activeAccounts.length, 0);
  assert.equal(getAccountLists().archivedAccounts.length, 1);
  assert.equal(getAccountLists().archivedCount, 3);
  setAccountDetail("crm-3", { account: { id: "crm-3", archived_at: null } });
  assert.equal(getAccountLists().activeAccounts.length, 1);
  assert.equal(getAccountLists().archivedAccounts.length, 0);
  assert.equal(getAccountLists().archivedCount, 2);
});

test("admin routes use history navigation and archived CRM data loads on demand", async () => {
  const [app, portal, crm] = await Promise.all([
    readFile(new URL("./App.jsx", import.meta.url), "utf8"),
    readFile(new URL("./AdminPortal.jsx", import.meta.url), "utf8"),
    readFile(new URL("./AdminCrm.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(app, /addEventListener\("popstate"/);
  assert.match(app, /history\[replace \? "replaceState" : "pushState"\]/);
  assert.match(portal, /Promise\.all\(\[loadAdminContext\(nextSession\), routePreload\]\)/);
  assert.doesNotMatch(crm, /Promise\.all\(\[\s*request\("\/api\/admin\/crm\/accounts/);
  assert.match(crm, /filter !== "archived" \|\| archivedAccounts/);
  assert.doesNotMatch(crm, /useEffect\(load,/);
  assert.match(crm, /useEffect\(\(\) => \{\s*load\(\);\s*\}, \[load\]\)/);
});

test("admin shell links remain SPA-driven across detail unmount and history transitions", async () => {
  const [app, portal] = await Promise.all([
    readFile(new URL("./App.jsx", import.meta.url), "utf8"),
    readFile(new URL("./AdminPortal.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(portal, /onNavigate\?\.\("\/admin\/onboard"\)/);
  assert.match(portal, /onNavigate\?\.\(href\)/);
  assert.match(app, /handlePopState/);
  assert.match(app, /removeEventListener\("popstate"/);
});

test("Archived stage calls existing archive workflow and restore preserves underlying stage", async () => {
  const crm = await readFile(new URL("./AdminCrm.jsx", import.meta.url), "utf8");
  assert.match(crm, /isArchived\(account\) \? "archived" : account\.stage/);
  assert.match(crm, /e\.target\.value === "archived" \? patch\(\{ archived: true \}\)/);
  assert.match(crm, /patch\(\{ archived: false \}\)/);
  assert.doesNotMatch(crm, /patch\(\{ stage: "archived" \}\)/);
});
