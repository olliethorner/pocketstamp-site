import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("./App.jsx", import.meta.url), "utf8");
const adminPortalSource = await readFile(new URL("./AdminPortal.jsx", import.meta.url), "utf8");
const posPageSource = await readFile(new URL("./PosCompatibilityPage.jsx", import.meta.url), "utf8");

test("App owns SPA history and resolves popstate for every admin route", () => {
  assert.match(appSource, /const \[pathname, setPathname\] = useState\(window\.location\.pathname\)/);
  assert.match(appSource, /addEventListener\("popstate", handlePopState\)/);
  assert.match(appSource, /history\[replace \? "replaceState" : "pushState"\]/);
  assert.match(appSource, /<AdminPortal path=\{pathname\} onNavigate=\{navigate\} \/>/);
});

test("AdminPortal resolves POS compatibility as an authenticated admin view only", () => {
  const authGate = adminPortalSource.indexOf("if (!session?.accessToken || !adminContext)");
  const posRoute = adminPortalSource.indexOf('if (path === "/admin/pos-compatibility")');
  assert.ok(authGate >= 0 && posRoute > authGate);
  assert.match(
    adminPortalSource,
    /if \(path === "\/admin\/pos-compatibility"\) return \(\s*<PosCompatibilityPage \{\.\.\.pageProps\} adminFetch=\{adminFetch\} AdminShell=\{AdminShell\} \/>/,
  );
  assert.doesNotMatch(appSource, /pathname[^\n]*pos-compatibility/);
});

test("POS compatibility forwards the shared navigation callback to AdminShell", () => {
  assert.match(
    posPageSource,
    /function PosCompatibilityPage\(\{[^}]*onNavigate[^}]*\}\)/,
  );
  assert.match(
    posPageSource,
    /<AdminShell active="\/admin\/pos-compatibility"[^>]*onNavigate=\{onNavigate\}>/,
  );
});

test("all AdminShell navigation items use the same SPA navigation callback", () => {
  for (const route of ["/admin/onboard", "/admin/cafes", "/admin/pos-compatibility", "/admin/account"]) {
    assert.ok(adminPortalSource.includes(`["${route}",`), `${route} is registered in AdminShell`);
  }
  assert.match(adminPortalSource, /event\.preventDefault\(\); onNavigate\?\.\(href\);/);
});
