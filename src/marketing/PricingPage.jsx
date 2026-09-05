import { useEffect } from "react";
import {
  ArrowUpRight,
  Wallet,
  Bell,
  Send,
  LayoutDashboard,
  ScanLine,
  Sparkles,
  Plus,
  Check,
} from "lucide-react";
import {
  Navigation,
  Footer,
  Button,
  SectionHeading,
  CheckList,
} from "./MarketingLayout.jsx";
import { demoHref } from "./marketingContent.js";
import {
  pricing,
  pounds,
  annualSaving,
  hardwareFirstYear,
  vatQualifier,
  includedFeatures,
  pricingFaqs,
} from "./pricingContent.js";
import "./marketing.css";

const featureIcons = [Wallet, Bell, Send, LayoutDashboard, ScanLine, Sparkles];

export default function PricingPage() {
  useEffect(() => {
    const title = "PocketStamp Pricing | £49/month per café";
    const description =
      "Every PocketStamp software feature for £49/month per café. Pay £539 yearly, or choose supplied counter hardware for £299 setup plus £49/month with a 12-month minimum commitment.";
    const canonical = "https://www.getpocketstamp.com/pricing";
    document.title = title;
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", canonical);
    for (const [selector, value] of [
      ['meta[name="description"]', description],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', description],
      ['meta[property="og:url"]', canonical],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', description],
    ])
      document.querySelector(selector)?.setAttribute("content", value);
  }, []);

  return (
    <div className="mk-site mk-pricing">
      <Navigation currentPage="pricing" />
      <main id="main-content">
        <section className="mk-pricing-intro">
          <div className="mk-container">
            <p className="mk-eyebrow mk-eyebrow-pill">
              <span /> Simple café loyalty
            </p>
            <h1>
              Simple pricing.
              <br />
              <span>Everything included.</span>
            </h1>
            <p>
              One complete loyalty platform for your café.
              <br className="mk-pricing-desktop-break" /> Choose software only,
              or add a dedicated PocketStamp counter setup.
            </p>
          </div>
        </section>

        <section
          className="mk-pricing-plans"
          aria-label="PocketStamp pricing options"
        >
          <div className="mk-container">
            <div className="mk-price-grid">
              <article
                className="mk-price-card mk-price-recommended"
                aria-labelledby="software-plan"
              >
                <div className="mk-plan-top">
                  <span className="mk-plan-icon">
                    <Wallet size={23} aria-hidden="true" />
                  </span>
                  <span className="mk-recommended">
                    <Check size={14} aria-hidden="true" /> Recommended
                  </span>
                </div>
                <h2 id="software-plan">PocketStamp</h2>
                <p className="mk-plan-description">
                  The complete software. Made for your café.
                </p>
                <div className="mk-price">
                  <strong>{pounds(pricing.monthly)}</strong>
                  <span>/ month</span>
                </div>
                <p className="mk-price-basis">
                  per café{vatQualifier && ` · ${vatQualifier}`}
                </p>
                <p className="mk-plan-promise">
                  Every software feature included.
                </p>
                <CheckList
                  items={[
                    "Your branded Apple Wallet + Google Wallet card",
                    "Stamps, rewards and merchant tools",
                    "Reminders and campaigns where supported",
                    "Use your own compatible counter equipment",
                  ]}
                />
                <div className="mk-plan-annual">
                  <span>Pay annually, get one month free</span>
                  <p>
                    <strong>{pounds(pricing.annual)}/year per café</strong>{" "}
                    <span>instead of {pounds(pricing.monthly * 12)}</span>
                  </p>
                  <small>
                    12 months of software. Save {pounds(annualSaving)}.
                  </small>
                </div>
                <Button href={demoHref} arrow>
                  Book a demo
                </Button>
              </article>
              <article
                className="mk-price-card mk-price-hardware"
                aria-labelledby="hardware-plan"
              >
                <div className="mk-plan-top">
                  <span className="mk-plan-icon">
                    <ScanLine size={23} aria-hidden="true" />
                  </span>
                  <span className="mk-hardware-label">
                    Supplied counter setup
                  </span>
                </div>
                <h2 id="hardware-plan">PocketStamp + Hardware</h2>
                <p className="mk-plan-description">
                  The same software, with a dedicated counter setup.
                </p>
                <div className="mk-price">
                  <strong>{pounds(pricing.hardwareSetup)}</strong>
                  <span>one-off setup</span>
                </div>
                <p className="mk-hardware-monthly">
                  + <strong>{pounds(pricing.monthly)}/month</strong> per café
                </p>
                <p className="mk-price-basis">
                  {pricing.hardwareMonths}-month minimum commitment
                  {vatQualifier && ` · ${vatQualifier}`}
                </p>
                <p className="mk-plan-promise">
                  Same complete PocketStamp software.
                </p>
                <CheckList
                  items={[
                    "Dedicated PocketStamp counter hardware",
                    "Supplied and configured for your café",
                    "Tablet and scanner setup for PocketStamp scanning",
                    "Merchant setup and onboarding",
                  ]}
                />
                <div className="mk-hardware-detail">
                  <p>
                    First-year total:{" "}
                    <strong>{pounds(hardwareFirstYear)}</strong>
                  </p>
                  <p>The software annual discount does not apply.</p>
                </div>
                <Button href={demoHref} secondary arrow>
                  Talk to us
                </Button>
              </article>
            </div>
            <p className="mk-pricing-shared-note">
              One complete product. Choose how you set up your counter.
            </p>
          </div>
        </section>

        <section className="mk-section mk-tint" id="included">
          <div className="mk-container">
            <SectionHeading
              eyebrow="Everything included"
              title="One product. Every feature."
              centered
            >
              <p>
                Every software feature is included in both options. No feature
                tiers.
                <br className="mk-pricing-desktop-break" /> No extra software
                charge to unlock marketing tools.
              </p>
            </SectionHeading>
            <div className="mk-included-grid">
              {includedFeatures.map(([title, body], index) => {
                const Icon = featureIcons[index];
                return (
                  <div className="mk-included-feature" key={title}>
                    <span className="mk-feature-icon">
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                );
              })}
            </div>
            <p className="mk-pricing-provider-note">
              Reminder availability and notification behaviour depend on the
              Wallet provider and your café’s configuration.
            </p>
          </div>
        </section>

        <section className="mk-section">
          <div className="mk-container">
            <SectionHeading
              eyebrow="Your café, your setup"
              title="The choice is at the counter."
              centered
            >
              <p>
                Marketing, reminders and your dashboard are included with either
                option.
              </p>
            </SectionHeading>
            <div className="mk-setup-comparison">
              <div>
                <p className="mk-eyebrow">Software only</p>
                <h3>Keep the setup that works for you.</h3>
                <p>
                  The complete PocketStamp platform without PocketStamp
                  supplying dedicated counter equipment. We’ll confirm your
                  scanner setup and compatibility during onboarding.
                </p>
                <span>
                  <Check size={16} aria-hidden="true" /> Full software included
                </span>
              </div>
              <div>
                <p className="mk-eyebrow">With hardware</p>
                <h3>Let us supply your counter setup.</h3>
                <p>
                  Dedicated PocketStamp counter hardware, supplied and
                  configured for your café. Includes the tablet and scanner
                  setup used for PocketStamp scanning.
                </p>
                <span>
                  <Check size={16} aria-hidden="true" /> Same full software +
                  hardware setup
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mk-annual-section" aria-labelledby="annual-title">
          <div className="mk-container mk-annual-callout">
            <div>
              <p className="mk-eyebrow">Software annual offer</p>
              <h2 id="annual-title">Pay yearly. Get a month on us.</h2>
              <p>
                12 months of PocketStamp software for {pounds(pricing.annual)}{" "}
                per café.
                <br />
                Save {pounds(annualSaving)} compared with twelve monthly
                payments.
              </p>
              <p className="mk-annual-only">
                Available on the software-only offer.
                {vatQualifier && ` ${vatQualifier}`}
              </p>
            </div>
            <div className="mk-annual-figure">
              <span>12 months. Pay for 11.</span>
              <strong>{pounds(pricing.annual)}</strong>
              <span>/ year per café</span>
            </div>
          </div>
        </section>

        <section className="mk-section" id="pricing-faq">
          <div className="mk-container mk-faq-layout">
            <SectionHeading
              eyebrow="A few useful answers"
              title="Clear before you start."
            >
              <p>Choosing your software and counter setup.</p>
              <a href={demoHref} className="mk-text-link">
                Talk it through with us{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </SectionHeading>
            <div className="mk-faq-list">
              {pricingFaqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <Plus size={19} aria-hidden="true" />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="mk-final">
          <div className="mk-container">
            <p className="mk-eyebrow">Your next regular starts here</p>
            <h2>
              Ready to bring your
              <br />
              customers back?
            </h2>
            <p>See how PocketStamp fits your café.</p>
            <Button href={demoHref} arrow>
              Book a demo
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
