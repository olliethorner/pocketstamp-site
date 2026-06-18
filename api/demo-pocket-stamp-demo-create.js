const API_BASE_URL = "https://pocketstamp-wallet-backend-production.up.railway.app";

function toAbsoluteBackendUrl(pathOrUrl) {
  return new URL(pathOrUrl, API_BASE_URL).toString();
}

function extractAddToWalletHref(html) {
  const linkMatch = html.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*Add Demo Card to Apple Wallet\s*<\/a>/i);
  return linkMatch?.[1] || "";
}

async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await readBody(request);
    const createResponse = await fetch(`${API_BASE_URL}/join/pocket-stamp-demo`, {
      method: "POST",
      headers: {
        "Content-Type": request.headers["content-type"] || "application/x-www-form-urlencoded",
      },
      body,
      redirect: "manual",
    });

    const location = createResponse.headers.get("location");

    if (!location) {
      response.status(502).json({ error: "Demo card was created, but no success URL was returned." });
      return;
    }

    const successUrl = toAbsoluteBackendUrl(location);
    const successResponse = await fetch(successUrl);
    const successHtml = await successResponse.text();
    const passHref = extractAddToWalletHref(successHtml);

    if (!passHref) {
      response.status(502).json({ error: "Demo card was created, but no Wallet pass URL was found." });
      return;
    }

    response.status(200).json({
      successUrl,
      passUrl: toAbsoluteBackendUrl(passHref),
    });
  } catch (error) {
    response.status(500).json({
      error: error.message || "Unable to create the demo Wallet card.",
    });
  }
}
