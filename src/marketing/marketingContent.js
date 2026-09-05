import { SALES_EMAIL } from "../contactEmails.js";

export const demoHref = `mailto:${SALES_EMAIL}?subject=PocketStamp demo enquiry`;
export const pilotHref = `mailto:${SALES_EMAIL}?subject=PocketStamp café pilot`;
export const demoJoinUrl = "/join/pocket-stamp-demo";
export const demoJoinAbsoluteUrl =
  "https://getpocketstamp.com/join/pocket-stamp-demo";

// Existing homepage content; birthday availability follows MerchantMarketing.
export const reminders = [
  ["Halfway", "You’re halfway to your free coffee."],
  ["Almost there", "Only one coffee away from your free one."],
  ["Reward ready", "Your free coffee is ready."],
  ["Birthday", "Happy Birthday! Enjoy a free coffee on us today."],
  ["Win-back", "A gentle nudge when a regular has not visited in a while."],
];

export const setupSteps = [
  [
    "Make it yours",
    "Send your logo, colours and reward. We build your Wallet card and join page.",
  ],
  [
    "Get your café ready",
    "You get your dashboard, Join QR and scanner setup. We get your team ready to use it.",
  ],
  [
    "Welcome them back",
    "Customers scan at the till to collect stamps. Wallet reminders and scheduled updates help bring them back.",
  ],
];

// Answers sourced from the existing homepage and the current merchant UI.
export const faqs = [
  [
    "Do customers need to download an app?",
    "No customer app is required. Customers scan your café’s Join QR and save their branded loyalty card to Apple Wallet or Google Wallet.",
  ],
  [
    "How do customers collect stamps?",
    "Customers scan their Wallet loyalty card at the till. PocketStamp records the visit and updates their loyalty progress. When a reward is ready, staff can redeem it.",
  ],
  [
    "Can I keep my existing till?",
    "PocketStamp Scanner is designed to run alongside compatible Android POS tablets. We’ll confirm compatibility as part of setup. If your setup isn’t compatible, PocketStamp can also be deployed with a dedicated scanner setup.",
  ],
  [
    "What reminders can PocketStamp send?",
    "PocketStamp supports halfway, almost-there, reward-ready and win-back reminders. Birthday reminders are available when birthday rewards are enabled for your loyalty programme. The reminder experience shown here is in Apple Wallet.",
  ],
  [
    "Can I send my own updates?",
    "You can write a short message and choose when it should go out. Promotional campaigns are available for Apple Wallet customers where the feature is enabled. Your dashboard shows campaign history and successful delivery counts.",
  ],
  [
    "What does getting started involve?",
    "We’ll configure PocketStamp with your café, install the scanner and get your team ready to use it. The pilot package has a setup fee and a monthly plan, with a clear offer agreed before anything goes live.",
  ],
];
