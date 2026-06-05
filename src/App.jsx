import { motion } from "framer-motion";
import { ArrowRight, Coffee, WalletCards, SmartphoneNfc, ShieldCheck, Store, Sparkles, CheckCircle2 } from "lucide-react";

export default function PocketStampLandingPage() {
  return (
    <main className="min-h-screen bg-[#F8F4EC] text-[#1F1B16]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(111,78,55,0.18),_transparent_35%),radial-gradient(circle_at_20%_20%,_rgba(214,162,104,0.22),_transparent_30%)]" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-sm">
              <Coffee size={21} />
            </div>
            <span className="text-xl font-semibold tracking-tight">PocketStamp</span>
          </div>
          <a
            href="mailto:hello@getpocketstamp.com"
            className="rounded-full bg-[#1F1B16] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            Contact
          </a>
        </nav>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-14 lg:grid-cols-2 lg:px-8 lg:pb-32 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D8C6AD] bg-white/70 px-4 py-2 text-sm text-[#6F4E37] backdrop-blur">
              <Sparkles size={16} />
              Built for independent cafés
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-[#1F1B16] sm:text-6xl lg:text-7xl">
              Tap-to-stamp loyalty cards in Apple Wallet.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5E554B]">
              PocketStamp replaces paper coffee stamp cards with a café-branded Apple Wallet loyalty pass. Customers tap their iPhone or Apple Watch at the till to collect stamps and redeem rewards — no customer app, no paper card, no QR-code loyalty flow.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:hello@getpocketstamp.com?subject=PocketStamp pilot enquiry"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6F4E37] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#5E422F]"
              >
                Join the pilot <ArrowRight size={18} />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-[#D8C6AD] bg-white/70 px-6 py-3.5 text-base font-semibold text-[#1F1B16] backdrop-blur transition hover:bg-white"
              >
                See how it works
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="rounded-[2rem] border border-[#E5D7C1] bg-white p-5 shadow-2xl shadow-[#6F4E37]/10">
              <div className="rounded-[1.5rem] bg-[#1F1B16] p-4 text-white">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/50">Apple Wallet</p>
                    <p className="mt-1 text-lg font-semibold">Café Loyalty</p>
                  </div>
                  <WalletCards className="text-[#D6A268]" />
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-[#6F4E37] to-[#A67855] p-5 shadow-inner">
                  <p className="text-sm text-white/70">The Daily Roast</p>
                  <h3 className="mt-1 text-2xl font-semibold">8 / 10 stamps</h3>
                  <div className="mt-6 grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex aspect-square items-center justify-center rounded-full ${i < 8 ? "bg-white text-[#6F4E37]" : "bg-white/20 text-white/60"}`}
                      >
                        <Coffee size={15} />
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-sm text-white/75">2 stamps away from a free coffee</p>
                </div>
              </div>
              <div className="mt-4 rounded-[1.5rem] border border-[#EFE5D6] bg-[#FBF8F2] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6F4E37] text-white">
                    <SmartphoneNfc size={22} />
                  </div>
                  <div>
                    <p className="font-semibold">Ready to stamp</p>
                    <p className="text-sm text-[#6F5E4D]">Customer taps Wallet pass at the till.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#6F4E37]">How it works</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">A modern version of the paper stamp card.</h2>
          <p className="mt-5 text-lg leading-8 text-[#5E554B]">
            PocketStamp is designed to make loyalty feel as quick as a physical stamp, while giving cafés a branded Wallet experience and better visibility into repeat customers.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Store,
              title: "1. The café gets a branded pass",
              body: "Each participating café has its own Apple Wallet loyalty pass with its brand, colours, stamp count, and reward rules.",
            },
            {
              icon: WalletCards,
              title: "2. Customers add it to Wallet",
              body: "Customers join once through a simple web flow and add the café loyalty card to Apple Wallet. No consumer app download required.",
            },
            {
              icon: SmartphoneNfc,
              title: "3. Tap to collect stamps",
              body: "At checkout, customers tap their iPhone or Apple Watch at the till. PocketStamp identifies the pass, adds stamps, and updates Wallet.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-[#E5D7C1] bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0E3D0] text-[#6F4E37]">
                <item.icon size={24} />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 leading-7 text-[#5E554B]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1F1B16] py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D6A268]">For cafés</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">No paper cards. No customer app. No complicated loyalty software.</h2>
          </div>
          <div className="grid gap-4">
            {[
              "Customers keep the loyalty card in Apple Wallet.",
              "Designed for contactless stamp collection and reward redemption.",
              "Merchant-side software manages stamps, rewards, and activity logs.",
              "Built for independent cafés that want a simple, branded loyalty experience.",
            ].map((text) => (
              <div key={text} className="flex gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#D6A268]" size={22} />
                <p className="leading-7 text-white/80">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-[#E5D7C1] bg-white p-7 shadow-sm lg:col-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0E3D0] text-[#6F4E37]">
              <ShieldCheck size={24} />
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight">Built around a cleaner loyalty experience.</h2>
            <p className="mt-4 leading-8 text-[#5E554B]">
              PocketStamp is currently in MVP/prototype development and is preparing pilot deployments with independent cafés. The intended production experience uses NFC-enabled Apple Wallet loyalty passes and supported merchant-side NFC acceptance so customers can tap to collect stamps at the point of sale.
            </p>
          </div>
          <div className="rounded-3xl bg-[#6F4E37] p-7 text-white shadow-sm">
            <h3 className="text-2xl font-semibold">Interested in the pilot?</h3>
            <p className="mt-4 leading-7 text-white/80">
              We’re speaking with independent cafés that want a more modern loyalty experience for regular customers.
            </p>
            <a
              href="mailto:hello@getpocketstamp.com?subject=PocketStamp pilot enquiry"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-[#6F4E37] transition hover:bg-[#F8F4EC]"
            >
              Contact PocketStamp <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E5D7C1] px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-[#6F5E4D] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PocketStamp. Currently in pilot/prototype development.</p>
          <a href="mailto:hello@getpocketstamp.com" className="hover:text-[#1F1B16]">hello@getpocketstamp.com</a>
        </div>
      </footer>
    </main>
  );
}
