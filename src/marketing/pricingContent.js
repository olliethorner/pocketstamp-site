// Approved commercial offer. PocketStamp is not currently VAT registered.
// Approved to launch without a VAT qualifier; keep public wording central here.
export const vatQualifier = "";
export const pricing = Object.freeze({
  monthly: 49,
  annual: 539,
  hardwareSetup: 299,
  hardwareMonths: 12,
});
export const pounds = (amount) => `£${amount}`;
export const annualSaving = pricing.monthly * 12 - pricing.annual;
export const hardwareFirstYear =
  pricing.hardwareSetup + pricing.monthly * pricing.hardwareMonths;

export const includedFeatures = [
  [
    "Digital loyalty",
    "Your branded loyalty card in Apple Wallet or Google Wallet, with digital stamps, reward progress and redemption.",
  ],
  [
    "Customer reminders",
    "Halfway, almost-there, reward-ready and win-back reminders where supported. Birthday rewards when enabled for your programme.",
  ],
  [
    "Marketing tools",
    "Schedule promotional messages, review campaign history and see delivery counts. Promotional campaigns are available for Apple Wallet customers where enabled.",
  ],
  [
    "Merchant dashboard",
    "View loyalty customers, stamp progress, rewards and recent activity.",
  ],
  [
    "Counter tools",
    "Scan Wallet cards, collect stamps and confirm reward redemption.",
  ],
  [
    "Getting started",
    "Your café branding, Wallet card, join page and Join QR, with help configuring your dashboard and scanner workflow.",
  ],
];

export const pricingFaqs = [
  [
    "Can I pay monthly?",
    `Yes. PocketStamp software costs ${pounds(pricing.monthly)} per month per café. The hardware option costs ${pounds(pricing.hardwareSetup)} upfront plus ${pounds(pricing.monthly)} per month per café, with a ${pricing.hardwareMonths}-month minimum commitment.`,
  ],
  [
    "What happens if I pay annually?",
    `Software-only customers can pay ${pounds(pricing.annual)} per café for 12 months, saving ${pounds(annualSaving)} compared with paying monthly for a year. This offer does not apply to PocketStamp + Hardware.`,
  ],
  [
    "Are all software features included?",
    "Yes. Both options include the complete PocketStamp software product. Hardware is not required to unlock marketing, reminders or dashboard functionality. Feature availability still depends on supported Wallet capabilities and your café’s configuration.",
  ],
  [
    "Do I need the supplied hardware?",
    "No. The software-only option does not include supplied counter equipment. We’ll confirm a compatible scanner setup with you during onboarding.",
  ],
  [
    "What does the £299 setup include?",
    "Dedicated PocketStamp counter hardware, supplied and configured for your café. Includes the tablet and scanner setup used for PocketStamp scanning, together with merchant setup and onboarding.",
  ],
  [
    "Does PocketStamp support both Wallets?",
    "Yes. Customers can add their loyalty card to Apple Wallet or Google Wallet. Reminder and campaign availability and notification behaviour vary by provider and configuration.",
  ],
  [
    "Can I keep my existing till?",
    "PocketStamp Scanner is designed to work alongside compatible Android POS tablets. We’ll confirm compatibility during setup. A dedicated counter setup is also available.",
  ],
];
