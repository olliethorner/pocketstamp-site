import { next } from "@vercel/functions";

const PUBLIC_ORIGIN = "https://www.getpocketstamp.com";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

export const config = {
  matcher: [
    "/join/:merchantSlug((?!pocket-stamp-demo$)[^/]+)",
    "/join/:merchantSlug((?!pocket-stamp-demo$)[^/]+)/success",
    "/join/:merchantSlug((?!pocket-stamp-demo$)[^/]+)/google-save-link",
  ],
};

export default function middleware(request) {
  const token = process.env.POCKETSTAMP_VERCEL_PROXY_TOKEN;
  if (new URL(request.url).origin !== PUBLIC_ORIGIN || !TOKEN_PATTERN.test(token || "")) {
    return next();
  }

  const headers = new Headers(request.headers);
  headers.set("x-pocketstamp-public-origin", PUBLIC_ORIGIN);
  headers.set("x-pocketstamp-proxy-token", token);
  return next({ request: { headers } });
}
