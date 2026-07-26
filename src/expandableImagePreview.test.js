import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("expandable image preview renders its source, intrinsic size, and accessible trigger", async () => {
  const vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  try {
    const { default: ExpandableImagePreview } = await vite.ssrLoadModule(
      "/src/ExpandableImagePreview.jsx",
    );
    const html = renderToStaticMarkup(createElement(ExpandableImagePreview, {
      src: "/merchant-marketing-campaigns.png",
      alt: "Merchant marketing campaign dashboard",
      dialogLabel: "Merchant marketing campaigns preview",
      width: 1448,
      height: 1086,
    }));

    assert.match(html, /src="\/merchant-marketing-campaigns\.png"/);
    assert.match(html, /alt="Merchant marketing campaign dashboard"/);
    assert.match(html, /width="1448"/);
    assert.match(html, /height="1086"/);
    assert.match(html, /aria-haspopup="dialog"/);
    assert.match(html, /aria-controls="image-preview-/);
  } finally {
    await vite.close();
  }
});
