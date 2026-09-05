import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Coffee,
  Gift,
  LayoutDashboard,
  Megaphone,
  QrCode,
  Radio,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { WalletNotification } from "./WalletVisuals.jsx";

// Display-only compositions of supported merchant UI. No API or product state.
export function CampaignVisual() {
  return (
    <figure className="mk-campaign-visual">
      <div className="mk-composer">
        <div className="mk-composer-heading">
          <span className="mk-mini-icon">
            <Megaphone size={20} />
          </span>
          <span>
            <strong>Send an Update</strong>
            <small>Promotional campaigns</small>
          </span>
          <span className="mk-demo-label">Example</span>
        </div>
        <div className="mk-composer-body">
          <div className="mk-composer-label">
            Message <span>31/250</span>
          </div>
          <div className="mk-message-field">2-for-1 coffees this Friday ☕️</div>
          <div className="mk-composer-label">Schedule time</div>
          <div className="mk-schedule-field">
            <CalendarDays size={16} />
            <span>Friday, 10:00 AM</span>
          </div>
          <div className="mk-static-button">
            Schedule Update <ArrowUpRight size={14} />
          </div>
          <div className="mk-campaign-history">
            <span>Campaign history</span>
            <div>
              <span>2-for-1 coffees this Friday ☕️</span>
              <small>Scheduled</small>
            </div>
          </div>
        </div>
      </div>
      <div className="mk-campaign-connector" aria-hidden="true">
        <span />
        <span>From your café to their Wallet</span>
        <span />
      </div>
      <WalletNotification
        title="Your café"
        message="2-for-1 coffees this Friday ☕️"
        campaign
      />
      <figcaption>Example scheduled Apple Wallet update</figcaption>
    </figure>
  );
}

export function CounterVisual() {
  const [reward, setReward] = useState(false);
  return (
    <figure className="mk-counter-visual">
      <div className="mk-counter-stage">
        <div className="mk-tablet">
          <div className="mk-tablet-camera" aria-hidden="true" />
          <div className="mk-tablet-screen">
            <div className="mk-pos-placeholder">
              <div>
                <span className="mk-pos-app-icon">
                  <Coffee size={17} />
                </span>
                <strong>Your existing POS</strong>
                <span>Counter</span>
              </div>
              <div className="mk-pos-skeleton" aria-hidden="true">
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
              </div>
              <p>Your normal till software stays on screen.</p>
            </div>
            <div
              className="mk-counter-notification"
              aria-live="polite"
              aria-atomic="true"
            >
              <div>
                <span className="mk-mini-brand">P</span>
                <strong>PocketStamp</strong>
                <small>now</small>
              </div>
              <p>
                <Check size={18} />
                {reward ? "Reward ready" : "Stamp added"}
              </p>
              <span>
                {reward
                  ? "Your customer has earned their reward."
                  : "Loyalty progress updated. Keep serving."}
              </span>
              {reward && (
                <div className="mk-reward-actions">
                  <span>Redeem</span>
                  <span>Skip</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <img
          src="/marketing/counter-scanner.png"
          alt="PocketStamp counter scanner"
          className="mk-counter-scanner"
          loading="lazy"
          decoding="async"
        />
        <div className="mk-counter-qr">
          <QrCode size={35} strokeWidth={1.4} />
          <span>
            Customer
            <br />
            Wallet QR
          </span>
        </div>
      </div>
      <div
        className="mk-counter-controls"
        aria-label="Preview a counter confirmation"
      >
        <button
          type="button"
          aria-pressed={!reward}
          onClick={() => setReward(false)}
        >
          Stamp collected
        </button>
        <button
          type="button"
          aria-pressed={reward}
          onClick={() => setReward(true)}
        >
          Reward ready
        </button>
      </div>
      <figcaption>
        Example loyalty confirmation · compatible Android POS setup
      </figcaption>
    </figure>
  );
}

const nav = [
  [LayoutDashboard, "Overview"],
  [Users, "Customers"],
  [Radio, "Activity"],
  [Megaphone, "Marketing"],
  [QrCode, "Get Customers"],
];
const activities = [
  [Users, "Maya joined", "New Wallet card", "10:42", "QR"],
  [Coffee, "Alex collected a stamp", "Loyalty progress updated", "10:49", "+1"],
  [
    Gift,
    "Priya redeemed reward",
    "Reward redemption recorded",
    "11:03",
    "Reward",
  ],
];

export function DashboardVisual() {
  return (
    <figure className="mk-dashboard-visual">
      <div className="mk-browser-bar">
        <span />
        <span />
        <span />
        <p>getpocketstamp.com / merchant</p>
        <span className="mk-browser-example">Example dashboard</span>
      </div>
      <div className="mk-dashboard-app">
        <aside className="mk-dashboard-sidebar">
          <div className="mk-dashboard-brand">
            <span className="mk-mini-brand">P</span>
            <strong>PocketStamp</strong>
          </div>
          <span className="mk-dashboard-cafe">Harbour House</span>
          <div
            className="mk-dashboard-nav"
            aria-label="Merchant dashboard sections"
          >
            {nav.map(([Icon, label], index) => (
              <span key={label} className={index === 0 ? "is-active" : ""}>
                <Icon size={16} />
                {label}
              </span>
            ))}
          </div>
          <div className="mk-dashboard-sidebar-bottom">
            <span className="mk-status-dot" /> Scanner ready
          </div>
        </aside>
        <div className="mk-dashboard-body">
          <div className="mk-dashboard-heading">
            <div>
              <p>YOUR CAFÉ, AT A GLANCE</p>
              <h3>Overview</h3>
              <span>Today at Harbour House</span>
            </div>
            <span className="mk-dashboard-sample">Sample activity</span>
          </div>
          <div className="mk-dashboard-metrics">
            {[
              [Wallet, "126", "Active Wallet cards"],
              [Coffee, "48", "Stamps today"],
              [Gift, "9", "Rewards redeemed"],
            ].map(([Icon, value, label]) => (
              <div key={label}>
                <span>
                  <Icon size={17} />
                  <span>{label}</span>
                </span>
                <strong>{value}</strong>
                <small>
                  {label === "Active Wallet cards"
                    ? "Your loyalty customers"
                    : label === "Stamps today"
                      ? "Stamps collected today"
                      : "Recorded redemptions"}
                </small>
              </div>
            ))}
          </div>
          <div className="mk-dashboard-panels">
            <div className="mk-dashboard-activity">
              <div className="mk-dashboard-panel-heading">
                <h4>Recent activity</h4>
                <span>
                  View all activity <ArrowUpRight size={12} />
                </span>
              </div>
              {activities.map(([Icon, title, detail, time, badge]) => (
                <div key={title} className="mk-activity-row">
                  <span className="mk-activity-icon">
                    <Icon size={17} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </div>
                  <time>{time}</time>
                  <span className="mk-activity-badge">{badge}</span>
                </div>
              ))}
            </div>
            <div className="mk-dashboard-quick">
              <h4>Quick actions</h4>
              <span>
                <QrCode size={15} /> Open Scanner Mode
              </span>
              <span>
                <Users size={15} /> View Customers
              </span>
              <span>
                <Search size={15} /> View Join QR
              </span>
            </div>
          </div>
          <div className="mk-dashboard-bottom">
            <div>
              <span className="mk-mini-icon">
                <Megaphone size={18} />
              </span>
              <div>
                <strong>Automated reminders</strong>
                <small>Help bring customers back.</small>
              </div>
              <ArrowUpRight size={14} />
            </div>
            <div>
              <span className="mk-mini-icon">
                <Radio size={18} />
              </span>
              <div>
                <strong>Scanner</strong>
                <small>Ready for the next visit.</small>
              </div>
              <span className="mk-status-dot" />
            </div>
          </div>
        </div>
      </div>
      <figcaption>
        Example data from the existing PocketStamp demonstration. Your dashboard
        shows your café’s activity.
      </figcaption>
    </figure>
  );
}
