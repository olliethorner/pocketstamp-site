import { useState } from "react";
import {
  BatteryFull,
  Signal,
  Wifi,
  Check,
  Wallet,
  QrCode,
  ArrowUpRight,
  Bell,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { demoJoinAbsoluteUrl, reminders } from "./marketingContent.js";

export function WalletCard({ priority = false }) {
  return (
    <img
      className="mk-wallet-card"
      src="/hero-wallet-cards/yeems-wallet-card.png"
      width="1074"
      height="1509"
      alt="Yeems Coffee Apple Wallet loyalty card with stamp progress, customer name, reward and QR code"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}

export function WalletPhone({ children, priority = false }) {
  return (
    <div className="mk-phone">
      <div className="mk-phone-screen">
        <div className="mk-phone-status" aria-hidden="true">
          <span>9:41</span>
          <i />
          <span>
            <Signal size={13} />
            <Wifi size={13} />
            <BatteryFull size={18} />
          </span>
        </div>
        <div className="mk-wallet-toolbar">
          <strong>Wallet</strong>
          <span aria-hidden="true">•••</span>
        </div>
        <WalletCard priority={priority} />
        {children}
        <div className="mk-phone-home" aria-hidden="true" />
      </div>
    </div>
  );
}

export function HeroWalletVisual() {
  return (
    <figure
      className="mk-hero-product"
      aria-label="PocketStamp café loyalty card in Apple Wallet"
    >
      <div className="mk-hero-atmosphere" aria-hidden="true" />
      <div className="mk-hero-side mk-hero-side-left">
        <div className="mk-mini-icon">
          <QrCode size={22} />
        </div>
        <strong>
          A quick scan.
          <br />A reason to return.
        </strong>
        <span>Your café’s Join QR</span>
        <svg viewBox="0 0 120 60" className="mk-hand-arrow" aria-hidden="true">
          <path d="M5 8C22 43 73 52 111 29m-17-2 18 1-6 17" />
        </svg>
      </div>
      <WalletPhone priority />
      <div className="mk-hero-side mk-hero-side-right">
        <span className="mk-status-dot" />
        <span>Always on hand</span>
        <strong>
          Your café.
          <br />
          Their Wallet.
        </strong>
        <p>
          Branded to you.
          <br />
          Ready for the next visit.
        </p>
      </div>
      <figcaption>
        <Wallet size={15} aria-hidden="true" /> Apple Wallet shown · Your logo.
        Your colours. Your reward.
      </figcaption>
    </figure>
  );
}

export function JoinVisual() {
  return (
    <div className="mk-join-visual">
      <div className="mk-join-qr">
        <span className="mk-eyebrow">Your next coffee starts here</span>
        <QRCodeSVG
          value={demoJoinAbsoluteUrl}
          size={132}
          marginSize={1}
          title="Scan to open the PocketStamp Apple Wallet demo join page"
        />
        <strong>Scan. Join. Enjoy.</strong>
        <span>PocketStamp demo QR</span>
      </div>
      <div className="mk-join-preview">
        <div className="mk-browser-bar">
          <span />
          <span />
          <span />
          <p>Join your café</p>
        </div>
        <div className="mk-join-preview-body">
          <span className="mk-mini-brand">P</span>
          <h3>
            Your loyalty card.
            <br />
            One quick signup.
          </h3>
          <div className="mk-static-field">
            <span>Full name</span>
            <div>Your name</div>
          </div>
          <div className="mk-static-field">
            <span>Email address</span>
            <div>you@example.com</div>
          </div>
          <p className="mk-join-consent">
            <Check size={14} /> Agree to the Loyalty Terms and acknowledge the
            Privacy Notice.
          </p>
          <div className="mk-static-button">Create Wallet Card</div>
        </div>
      </div>
    </div>
  );
}

export function WalletDetail() {
  return (
    <figure className="mk-wallet-detail">
      <div className="mk-wallet-detail-card">
        <WalletCard />
      </div>
      <div className="mk-wallet-detail-tag">
        <Check size={14} />
        <span>Your logo. Your colours.</span>
      </div>
      <figcaption>
        <span>One card. Always on hand.</span>
        <span>Apple Wallet shown</span>
      </figcaption>
    </figure>
  );
}

export function Journey() {
  return (
    <div className="mk-journey">
      <div className="mk-journey-step">
        <div className="mk-journey-stage">
          <JoinVisual />
        </div>
        <div className="mk-step-copy">
          <span>01</span>
          <div>
            <h3>Join in seconds</h3>
            <p>
              Customers scan your café’s Join QR. A simple signup starts the
              flow.
            </p>
          </div>
        </div>
      </div>
      <div className="mk-journey-step">
        <div className="mk-journey-stage mk-journey-wallet">
          <WalletCard />
          <span>
            <Wallet size={14} /> Add to Wallet
          </span>
        </div>
        <div className="mk-step-copy">
          <span>02</span>
          <div>
            <h3>Add to Wallet</h3>
            <p>
              They save your branded card to Apple Wallet or Google Wallet — no
              app download.
            </p>
          </div>
        </div>
      </div>
      <div className="mk-journey-step">
        <div className="mk-journey-stage mk-journey-scan">
          <QrCode size={50} strokeWidth={1.3} />
          <span className="mk-scan-line" />
          <div className="mk-scan-result">
            <span>
              <Check size={18} />
            </span>
            <div>
              <strong>Stamp added</strong>
              <small>Loyalty progress updated</small>
            </div>
          </div>
          <p>Scan your Wallet card at the till</p>
        </div>
        <div className="mk-step-copy">
          <span>03</span>
          <div>
            <h3>Scan at the till</h3>
            <p>
              PocketStamp records the visit and updates their progress. Your
              team keeps serving.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletNotification({
  message,
  title = "Your café",
  campaign = false,
}) {
  return (
    <div
      className={`mk-notification${campaign ? " mk-notification-campaign" : ""}`}
    >
      <div className="mk-notification-top">
        <span className="mk-wallet-app" aria-hidden="true">
          <Wallet size={17} />
        </span>
        <strong>{title}</strong>
        <span>now</span>
      </div>
      <p>{message}</p>
    </div>
  );
}

export function RemindersVisual() {
  const [selected, setSelected] = useState(1);
  return (
    <div className="mk-reminders-demo">
      <div className="mk-reminder-options" aria-label="Preview a reminder">
        {reminders.map(([label, copy], index) => (
          <button
            key={label}
            type="button"
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span className="mk-reminder-index">0{index + 1}</span>
            <span>
              <strong>{label}</strong>
              <small>
                {index === 3 ? "When birthday rewards are enabled" : copy}
              </small>
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        ))}
      </div>
      <figure className="mk-reminder-scene">
        <div className="mk-lock-phone">
          <div className="mk-lock-island" aria-hidden="true" />
          <div className="mk-lock-date" aria-hidden="true">
            Tuesday, 9 June<strong>9:41</strong>
          </div>
          <div aria-live="polite" aria-atomic="true">
            <WalletNotification message={reminders[selected][1]} />
          </div>
          <div className="mk-lock-caption">
            <Bell size={16} />
            <span>A timely reason to return.</span>
          </div>
          <div className="mk-phone-home" aria-hidden="true" />
        </div>
        <figcaption>Example Apple Wallet reminder</figcaption>
      </figure>
    </div>
  );
}
