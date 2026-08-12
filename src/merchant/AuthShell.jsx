export function MerchantAuthBrand() {
  return <a href="/" className="flex items-center gap-3" aria-label="PocketStamp home"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#143d3b] text-sm font-bold text-white">PS</span><span className="text-xl font-semibold">PocketStamp Merchant</span></a>;
}

export default function AuthShell({ children, width = "max-w-md" }) {
  return <main className="min-h-screen overflow-x-hidden bg-[#fbfaf7] px-4 py-8 text-slate-950 sm:px-6 sm:py-10"><div className={`mx-auto flex min-h-[calc(100vh-4rem)] w-full ${width} items-center sm:min-h-[calc(100vh-5rem)]`}><div className="w-full rounded-3xl bg-white p-6 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200 sm:p-8">{children}</div></div></main>;
}
