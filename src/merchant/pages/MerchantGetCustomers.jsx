import { QRCodeSVG } from "qrcode.react";
import { getJoinAvailability } from "../utils/joinUrl.js";

export default function MerchantGetCustomers({
  joinUrl,
  copyState,
  onCopyJoinUrl,
}) {
  const availability = getJoinAvailability(joinUrl);

  if (!availability.hasJoinUrl) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200 sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ps-blue-soft)] text-sm font-bold text-[var(--ps-blue)]">
          QR
        </div>
        <h2 className="mt-5 text-2xl font-semibold">Your customer join link is not available yet.</h2>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-[var(--ps-muted)]">
          Refresh once your PocketStamp setup is complete, or contact PocketStamp support if you need help.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-7">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Your customer join QR</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--ps-muted)]">
            Show this QR at the counter so customers can join your loyalty programme.
          </p>
        </div>

        {availability.showQr ? (
          <div className="mx-auto mt-5 max-w-[300px] rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <QRCodeSVG
                value={joinUrl}
                size={248}
                level="M"
                includeMargin
                role="img"
                title={`QR code for ${joinUrl}`}
                className="block h-auto w-full"
                bgColor="#ffffff"
                fgColor="#020617"
              />
            </div>
          </div>
        ) : null}

        <p className="mt-5 break-all rounded-xl bg-[var(--ps-cream)] p-4 text-center text-sm font-semibold leading-6">
          {joinUrl}
        </p>

        {availability.showActions ? (
          <div className="mx-auto mt-4 grid max-w-md gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCopyJoinUrl}
              className="min-h-12 rounded-full bg-[var(--ps-blue)] px-4 py-3 text-sm font-semibold text-white"
            >
              {copyState === "copied"
                ? "Link copied"
                : copyState === "failed"
                  ? "Copy failed"
                  : "Copy link"}
            </button>
            <a
              href={joinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--ps-border)] bg-white px-4 py-3 text-sm font-semibold"
            >
              Open join page
            </a>
          </div>
        ) : null}
      </section>

      <aside className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-xl font-semibold">How customers join</h2>
        <ol className="mt-5 space-y-4">
          {[
            ["1", "Scan the QR code", "Customers point their phone camera at your QR."],
            ["2", "Enter their details", "They add the details needed for their loyalty card."],
            ["3", "Add to Apple Wallet", "Their PocketStamp card is saved to Apple Wallet."],
          ].map(([number, title, text]) => (
            <li key={number} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ps-blue-soft)] text-xs font-bold text-[var(--ps-blue)]">{number}</span>
              <span>
                <strong className="block text-sm">{title}</strong>
                <span className="mt-1 block text-sm leading-6 text-[var(--ps-muted)]">{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-5 border-t border-[var(--ps-border)] pt-4 text-sm leading-6 text-[var(--ps-muted)]">
          Place the QR where customers can easily scan it while ordering or paying.
        </p>
      </aside>
    </div>
  );
}
