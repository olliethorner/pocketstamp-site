import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Coffee,
  QrCode,
  Radio,
  WalletCards,
} from "lucide-react";

const demoHref =
  "mailto:hello@getpocketstamp.com?subject=PocketStamp demo enquiry";
const pilotHref =
  "mailto:hello@getpocketstamp.com?subject=PocketStamp café pilot";

const problems = [
  ["Lost cards", "Paper cards are familiar, but easy to lose."],
  ["App fatigue", "Customers do not want another loyalty app."],
  ["No visibility", "Manual stamping gives you no customer data."],
];

const steps = [
  ["Scan QR", "Customer scans your café’s join QR.", QrCode],
  ["Add to Wallet", "They create a branded loyalty card in Apple Wallet.", WalletCards],
  ["Tap at the counter", "They tap their phone or watch on a compatible reader.", Radio],
  ["Track everything", "You see customers, stamps and rewards in your dashboard.", BarChart3],
];

const walletBullets = [
  "Branded with your logo and colours",
  "No customer app",
  "Always on their phone",
  "Updates automatically",
  "Replaces the paper stamp card",
];

const readerBullets = [
  ["Dedicated reader at the till", "A countertop device for fast loyalty taps."],
  [
    "Connects to PocketStamp",
    "Reader events are routed to your backend so stamps update automatically.",
  ],
  ["Minimal staff action", "Customers tap. PocketStamp records the stamp."],
  [
    "Built for compatible Wallet readers",
    "Designed around Apple Wallet VAS-compatible reader workflows, including VTAP-style hardware.",
  ],
];

const dashboardBullets = [
  "Live activity",
  "Customer list",
  "Reward redemptions",
  "Join QR and URL",
  "Reader status",
  "Basic repeat-visit analytics",
];

const stats = [
  ["0", "apps to download"],
  ["1", "tap to collect"],
  ["24/7", "Wallet access"],
  ["100%", "branded"],
];

const setupSteps = [
  "Send your logo, colours and reward",
  "We build your Wallet card and join page",
  "You get your dashboard, QR code and reader setup",
  "Customers start joining",
];

function WalletPassMockup({ hero = false }) {
  return (
    <div className={`mx-auto w-full ${hero ? "max-w-lg" : "max-w-sm"}`}>
      <div className="rounded-[34px] bg-slate-950 p-3 shadow-2xl shadow-slate-900/20">
        <div className="rounded-[28px] bg-white p-3">
          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <div className="bg-[#143d3b] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#143d3b]">
                  <Coffee size={25} />
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  <WalletCards size={14} />
                  Apple Wallet
                </div>
              </div>

              <p className="mt-8 text-sm font-semibold uppercase text-white/65">
                Harbour House Café
              </p>
              <p className="mt-3 text-xs font-semibold uppercase text-white/55">
                Stamps
              </p>
              <p className="mt-1 text-5xl font-semibold">0/10</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-full border border-slate-300 bg-slate-50"
                  />
                ))}
              </div>

              <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Reward
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">
                    10th coffee free
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-2 rounded-sm ${
                        index % 3 === 0 ? "bg-slate-950" : "bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HardwareMockup() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="relative min-h-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200">
        <div className="absolute left-8 top-8 rounded-full bg-[#e7f7f3] px-4 py-2 text-xs font-semibold text-[#16856f]">
          Ready for Wallet tap
        </div>

        <div className="absolute bottom-16 left-10 h-32 w-64 rounded-2xl bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/25">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-white/40">
                Reader 01
              </p>
              <p className="mt-1 text-lg font-semibold">Counter till</p>
            </div>
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/8">
              <Radio className="text-[#63c7b2]" size={25} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#63c7b2]" />
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <span className="h-2 w-2 rounded-full bg-[#63c7b2]" />
            <span className="h-2 w-2 rounded-full bg-[#63c7b2]/70" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
          </div>
        </div>

        <div className="absolute bottom-28 left-44 flex h-52 w-52 items-center justify-center rounded-full border border-[#63c7b2]/20">
          <span className="absolute h-36 w-36 rounded-full border border-[#63c7b2]/35" />
          <span className="absolute h-24 w-24 rounded-full border border-[#63c7b2]/55" />
          <Radio className="text-[#16856f]" size={34} />
        </div>

        <div className="absolute right-10 top-24 w-60 rotate-6 rounded-[32px] bg-slate-950 p-2 shadow-2xl shadow-slate-900/25">
          <div className="rounded-[26px] bg-white p-3">
            <div className="rounded-xl bg-[#143d3b] p-5 text-white">
              <div className="flex items-center justify-between">
                <Coffee size={24} />
                <WalletCards className="text-[#f4c15d]" size={24} />
              </div>
              <p className="mt-9 text-xs font-semibold uppercase text-white/60">
                PocketStamp
              </p>
              <p className="mt-1 text-lg font-semibold">Harbour House</p>
              <p className="mt-5 text-xs font-semibold uppercase text-white/55">
                Stamps
              </p>
              <p className="mt-1 text-4xl font-semibold">0/10</p>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-1.5">
              {Array.from({ length: 10 }).map((_, index) => (
                <span key={index} className="aspect-square rounded-full bg-slate-200" />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 right-10 rounded-xl bg-white px-4 py-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-[#16856f]" size={18} />
            <p className="text-sm font-semibold text-slate-950">Stamp added</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">Pass update sent</p>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  const rows = [
    ["10:42", "Maya joined", "QR"],
    ["10:49", "Alex collected a stamp", "+1"],
    ["11:03", "Priya redeemed reward", "Reward"],
  ];

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-2xl bg-white p-5 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              PocketStamp dashboard
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              Today at Harbour House
            </p>
          </div>
          <div className="rounded-xl bg-[#e7f7f3] p-3 text-[#16856f]">
            <Activity size={22} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["126", "customers"],
            ["48", "stamps"],
            ["9", "rewards"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-semibold text-slate-950">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          {rows.map(([time, event, tag]) => (
            <div
              key={`${time}-${event}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">{event}</p>
                <p className="mt-0.5 text-xs text-slate-500">{time}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                {tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, body }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase text-[#16856f]">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-semibold text-slate-950 sm:text-5xl">
        {title}
      </h2>
      {body ? <p className="mt-5 text-lg leading-8 text-slate-600">{body}</p> : null}
    </div>
  );
}

function SimpleBullets({ items }) {
  return (
    <ul className="mt-7 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-3 text-slate-700">
          <CheckCircle2 className="shrink-0 text-[#16856f]" size={20} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FeatureBullets({ items }) {
  return (
    <ul className="mt-8 space-y-5">
      {items.map(([title, body]) => (
        <li key={title} className="flex gap-4">
          <CheckCircle2 className="mt-1 shrink-0 text-[#16856f]" size={21} />
          <div>
            <p className="font-semibold text-slate-950">{title}</p>
            <p className="mt-1 leading-7 text-slate-600">{body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function PocketStampLandingPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-slate-950">
      <section className="bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="PocketStamp home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#143d3b] text-white">
              <Coffee size={21} />
            </span>
            <span className="text-xl font-semibold">PocketStamp</span>
          </a>
          <a
            href={demoHref}
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book a demo
          </a>
        </nav>

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Apple Wallet loyalty for cafés
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl lg:text-7xl">
              Paper stamp cards, rebuilt for Apple Wallet.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">
              Customers add your branded café rewards card to Apple Wallet,
              then tap in-store to collect stamps. No customer app. No paper
              cards. No extra staff app.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={demoHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#143d3b] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#0f302f]"
              >
                Book a demo <ArrowRight size={18} />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-950 transition hover:border-slate-400"
              >
                See how it works
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <WalletPassMockup hero />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Why change
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950">
              Keep the habit. Remove the friction.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              PocketStamp keeps the stamp-card ritual and removes the parts
              that slow it down.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {problems.map(([title, body]) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-lg font-semibold text-slate-950">{title}</p>
                <p className="mt-3 leading-7 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeader
            eyebrow="How it works"
            title="Four steps from QR to repeat visit."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, body, Icon], index) => (
              <div key={title} className="rounded-2xl bg-[#fbfaf7] p-6 ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f7f3] text-[#16856f]">
                    <Icon size={22} />
                  </div>
                  <span className="text-sm font-semibold text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-slate-500">
            Designed around compatible Apple Wallet reader workflows, including
            VTAP-style Apple VAS-compatible hardware.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <WalletPassMockup />
          <div>
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Branded Wallet cards
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950">
              Your café, inside your customer’s Wallet.
            </h2>
            <SimpleBullets items={walletBullets} />
          </div>
        </div>
      </section>

      <section className="bg-[#eef8f5] py-24">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Counter hardware
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950 sm:text-5xl">
              Tap-to-stamp hardware reader
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              A small counter reader lets customers collect stamps with a quick
              tap of their iPhone or Apple Watch.
            </p>
            <FeatureBullets items={readerBullets} />
            <a
              href={demoHref}
              className="mt-9 inline-flex items-center gap-2 font-semibold text-[#143d3b] hover:text-[#0f302f]"
            >
              Hardware reader setup <ArrowRight size={18} />
            </a>
          </div>
          <HardwareMockup />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <DashboardMockup />
          <div>
            <p className="text-sm font-semibold uppercase text-[#16856f]">
              Merchant dashboard
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950">
              See every stamp, customer and reward.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Your dashboard shows what happened today, who joined, and which
              rewards were redeemed.
            </p>
            <SimpleBullets items={dashboardBullets} />
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-4 lg:px-8">
          {stats.map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-white/5 p-6">
              <p className="text-4xl font-semibold text-[#f4c15d]">{value}</p>
              <p className="mt-3 text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeader eyebrow="Setup" title="Set up in days, not months." />
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
            {setupSteps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-2xl bg-[#fbfaf7] p-6 ring-1 ring-slate-200">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="leading-7 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="rounded-3xl bg-[#143d3b] p-8 text-white shadow-2xl shadow-[#143d3b]/15 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-4xl font-semibold">
                Ready to replace paper stamp cards?
              </h2>
              <p className="mt-4 text-lg text-white/75">
                Pilot spaces available for independent cafés.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={demoHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[#143d3b] transition hover:bg-slate-100"
              >
                Book a demo <ArrowRight size={18} />
              </a>
              <a
                href={pilotHref}
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Start a café pilot
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PocketStamp.</p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:hello@getpocketstamp.com" className="hover:text-slate-950">
              hello@getpocketstamp.com
            </a>
            <a href="/join/without-borders" className="hover:text-slate-950">
              Example join URL
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
