import { useEffect } from "react";
import { Check, ArrowUpRight, Wallet, Plus } from "lucide-react";
import {
  Navigation,
  Footer,
  Button,
  SectionHeading,
  CheckList,
} from "./MarketingLayout.jsx";
import {
  HeroWalletVisual,
  WalletDetail,
  Journey,
  RemindersVisual,
} from "./WalletVisuals.jsx";
import {
  CampaignVisual,
  CounterVisual,
  DashboardVisual,
} from "./MerchantVisuals.jsx";
import { demoHref, demoJoinUrl, setupSteps, faqs } from "./marketingContent.js";
import { pricing, pounds, vatQualifier } from "./pricingContent.js";
import "./marketing.css";

export default function MarketingHomepage() {
  useEffect(() => {
    const title = "PocketStamp – Wallet Loyalty That Works Alongside Your POS";
    const description =
      "Digital café loyalty in Apple Wallet and Google Wallet, designed to work alongside compatible Android POS tablets — no customer app required.";
    const canonicalUrl = "https://www.getpocketstamp.com/";
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", canonicalUrl);
    for (const [selector, content] of [
      ['meta[property="og:url"]', canonicalUrl],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', description],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', description],
    ])
      document.querySelector(selector)?.setAttribute("content", content);
    document.title =
      "PocketStamp – Wallet Loyalty That Works Alongside Your POS";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Digital café loyalty in Apple Wallet and Google Wallet, designed to work alongside compatible Android POS tablets — no customer app required.",
      );
  }, []);

  return (
    <div className="mk-site">
      <Navigation />
      <main id="main-content">
        <section className="mk-hero">
          <div className="mk-container">
            <div className="mk-hero-copy">
              <p className="mk-eyebrow mk-eyebrow-pill">
                <span /> Wallet loyalty for independent cafés
              </p>
              <h1>
                Digital loyalty for cafés.
                <br />
                <span>Right in their Wallet.</span>
              </h1>
              <p className="mk-hero-intro">
                Give customers a branded loyalty card in Apple Wallet or Google
                Wallet. Stamps, rewards and timely reminders give them reasons
                to return.
              </p>
              <div className="mk-actions">
                <Button href={demoHref} arrow>
                  Book a demo
                </Button>
                <Button href={demoJoinUrl} secondary>
                  Try a demo card
                </Button>
              </div>
              <div className="mk-hero-benefits">
                {[
                  "No customer app",
                  "No paper stamp cards",
                  "Your café’s own branding",
                ].map((text) => (
                  <span key={text}>
                    <Check size={14} aria-hidden="true" />
                    {text}
                  </span>
                ))}
              </div>
            </div>
            <HeroWalletVisual />
          </div>
        </section>
        <div className="mk-wallet-support">
          <div className="mk-container">
            <span>Built for the Wallet they already use.</span>
            <div>
              <span>
                <Wallet size={18} aria-hidden="true" /> Apple Wallet
              </span>
              <i aria-hidden="true" />
              <span>
                <Wallet size={18} aria-hidden="true" /> Google Wallet
              </span>
            </div>
          </div>
        </div>

        <section id="system" className="mk-section">
          <div className="mk-container mk-split">
            <div>
              <SectionHeading
                eyebrow="Their phone. Your café."
                title={
                  <>
                    No app. No paper.
                    <br />
                    No forgotten stamp cards.
                  </>
                }
              >
                <p>
                  A loyalty experience that stays with your customer, not in a
                  drawer. Just a branded card for Apple Wallet or Google Wallet
                  that customers scan at the till and keep on their phone.
                </p>
              </SectionHeading>
              <CheckList
                items={[
                  "Branded with your logo and colours",
                  "Updates as stamps are collected",
                  "Replaces the paper stamp card",
                ]}
              />
              <a href={demoJoinUrl} className="mk-text-link">
                Try the PocketStamp demo card <ArrowUpRight size={16} />
              </a>
            </div>
            <WalletDetail />
          </div>
        </section>

        <section id="how-it-works" className="mk-section mk-tint">
          <div className="mk-container">
            <SectionHeading
              eyebrow="How it works"
              title="From a quick scan to a customer who comes back."
              centered
            >
              <p>
                A simple QR starts the flow. The card lives in Wallet, the
                dashboard tracks activity, and timely reminders give customers a
                reason to return.
              </p>
            </SectionHeading>
            <Journey />
            <p className="mk-section-note">
              The QR opens our Apple Wallet demo. Your café gets its own branded
              join page.
            </p>
          </div>
        </section>

        <section id="retention" className="mk-section">
          <div className="mk-container">
            <SectionHeading
              eyebrow="Automatic Wallet reminders"
              title="Your loyalty card keeps the conversation going."
              centered
            >
              <p>
                PocketStamp responds to customer activity with reminders about
                progress, ready rewards, birthdays and reasons to return after
                time away.
              </p>
            </SectionHeading>
            <RemindersVisual />
          </div>
        </section>
        <section id="campaigns" className="mk-section mk-tint">
          <div className="mk-container mk-split">
            <CampaignVisual />
            <div>
              <SectionHeading
                eyebrow="Scheduled by your café"
                title="Send the right update at the right time."
              >
                <p>
                  Write a short message and choose when it should go out. Share
                  offers, events, new products, launches or timely announcements
                  with loyal customers through their Wallet card.
                </p>
              </SectionHeading>
              <CheckList
                items={[
                  "Schedule short promotional messages",
                  "Review your campaign history",
                  "See successful delivery counts",
                ]}
              />
              <p className="mk-provider-note">
                Promotional campaigns are available for Apple Wallet customers
                where this feature is enabled.
              </p>
            </div>
          </div>
        </section>

        <section id="existing-pos" className="mk-section">
          <div className="mk-container">
            <SectionHeading
              eyebrow="Built for the counter"
              title="Your till stays your till."
              centered
            >
              <p>
                Digital loyalty, without changing how you run your café. On
                compatible Android POS tablets, PocketStamp Scanner runs quietly
                in the background. Staff stay in their normal till software
                while PocketStamp handles loyalty.
              </p>
            </SectionHeading>
            <CounterVisual />
            <div className="mk-counter-benefits">
              <div>
                <h3>Customers scan. Staff keep serving.</h3>
                <p>
                  A quick notification confirms the result over the POS screen.
                  When a reward is ready, staff can Redeem or Skip.
                </p>
              </div>
              <div>
                <h3>Flexible when you need it.</h3>
                <p>
                  Adjust multi-coffee orders from the notification shade, with
                  manual corrections available when needed.
                </p>
              </div>
              <div>
                <h3>Less hardware. Less counter clutter.</h3>
                <p>
                  We’ll confirm Android POS compatibility as part of setup. A
                  dedicated scanner setup is available as a fallback.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="dashboard" className="mk-section mk-blue-tint">
          <div className="mk-container">
            <SectionHeading
              eyebrow="A clearer view of loyalty"
              title="See what paper cards never showed you."
              centered
            >
              <p>
                Your dashboard shows today’s joins, stamps, rewards, customer
                progress and scanner activity. Schedule Wallet updates, review
                campaign history and see successful delivery counts.
              </p>
            </SectionHeading>
            <DashboardVisual />
            <div className="mk-dashboard-link">
              <a href="/dashboard-demo" className="mk-text-link">
                Explore the dashboard demo <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>
        <section id="pilot" className="mk-section">
          <div className="mk-container">
            <SectionHeading
              eyebrow="Simple café setup"
              title="Your café. One connected system."
              centered
            >
              <p>
                We’ll configure PocketStamp with your café, install the scanner,
                and get your team ready to use it — from the Wallet card and
                Join QR to your dashboard and counter workflow.
              </p>
            </SectionHeading>
            <div className="mk-setup-steps">
              {setupSteps.map(([title, body], index) => (
                <div key={title}>
                  <span>0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
            <div className="mk-offer">
              <div className="mk-offer-copy">
                <p className="mk-eyebrow">Simple café pricing</p>
                <h3>
                  Simple setup,
                  <br />
                  shaped around your café.
                </h3>
                <p>
                  Built for cafés that want to replace paper stamp cards without
                  asking customers to download another app.
                </p>
                <span className="mk-offer-platforms">
                  <Wallet size={17} /> Apple Wallet + Google Wallet
                </span>
              </div>
              <div className="mk-offer-package">
                <p className="mk-eyebrow">All software features included</p>
                <h3>
                  From {pounds(pricing.monthly)}
                  <br />
                  <span>/month per café</span>
                </h3>
                <p>
                  Every software feature included. Explore annual and hardware
                  options.
                </p>
                {vatQualifier && <p>{vatQualifier}</p>}
                <CheckList
                  items={[
                    "Branded Wallet card and join page",
                    "Join QR and scanner setup",
                    "Merchant dashboard",
                    "Wallet reminders and scheduled updates",
                  ]}
                />
                <Button href="/pricing" arrow>
                  View pricing
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mk-section mk-tint">
          <div className="mk-container mk-faq-layout">
            <SectionHeading
              eyebrow="A few useful answers"
              title={
                <>
                  Good questions.
                  <br />
                  Simple answers.
                </>
              }
            >
              <p>From the first scan to the daily counter routine.</p>
              <a className="mk-text-link" href={demoHref}>
                Talk it through with us <ArrowUpRight size={16} />
              </a>
            </SectionHeading>
            <div className="mk-faq-list">
              {faqs.map(([question, answer]) => (
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
            <p className="mk-eyebrow">Ready when you are</p>
            <h2>
              Start bringing loyal customers
              <br />
              back this week.
            </h2>
            <p>
              Customers use Wallet. Staff keep using their till. PocketStamp
              handles loyalty — and gives customers timely reasons to return.
            </p>
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
