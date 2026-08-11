function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export const CUSTOMER_PAGE_SIZE = 10;

export function formatCustomerDate(timestamp) {
  if (!timestamp) return "Not recorded";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function formatCustomerShortDate(timestamp) {
  if (!timestamp) return "No activity yet";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export function formatCustomerBirthday(customer) {
  const month = Number(customer.birthdayMonth);
  const day = Number(customer.birthdayDay);
  if (!month || !day) return "Not saved";
  const date = new Date(2024, month - 1, day);
  if (Number.isNaN(date.getTime())) return "Not saved";
  return `${new Intl.DateTimeFormat(undefined, { month: "short" }).format(date)} ${day}`;
}

export function getCustomerName(customer) {
  return pickFirst(customer.name, customer.fullName, customer.firstName, "Customer");
}

export function getCustomerId(customer, index) {
  return pickFirst(customer.id, customer.passSerialNumber, customer.email, `customer-${index}`);
}

export function getCustomerStampProgress(customer) {
  const currentStamps = Number(customer.currentStamps ?? 0);
  const rewardThreshold = Number(customer.rewardThreshold ?? 10);
  return `${Number.isFinite(currentStamps) ? currentStamps : 0}/${
    Number.isFinite(rewardThreshold) && rewardThreshold > 0 ? rewardThreshold : 10
  }`;
}

export function getCustomerStatus(customer, birthdayRewardsEnabled = false) {
  const statusText = [
    customer.rewardStatus,
    customer.status,
    customer.walletPassStatus,
    birthdayRewardsEnabled && customer.birthdayActive ? "birthday_active" : null,
  ].filter(Boolean).join(" ").toLowerCase();
  const currentStamps = Number(customer.currentStamps ?? 0);
  const rewardThreshold = Number(customer.rewardThreshold ?? 10);
  const hasBirthday = Boolean(customer.birthdayMonth && customer.birthdayDay);

  if (birthdayRewardsEnabled && statusText.includes("birthday_active")) return "Birthday reward active";
  if (statusText.includes("reward_ready") || statusText.includes("ready")) return "Reward ready";
  if (statusText.includes("almost_there") || statusText.includes("almost")) return "Almost there";
  if (birthdayRewardsEnabled && hasBirthday && statusText.includes("birthday")) return "Birthday saved";
  if (Number.isFinite(currentStamps) && Number.isFinite(rewardThreshold) && rewardThreshold > 0) {
    if (currentStamps >= rewardThreshold) return "Reward ready";
    if (rewardThreshold - currentStamps <= 2) return "Almost there";
  }
  if (birthdayRewardsEnabled && hasBirthday) return "Birthday saved";
  return "Active";
}

export function getCustomerStatusClass(status) {
  if (status === "Reward ready" || status === "Birthday reward active") return "bg-[#e7f7f3] text-[#16856f]";
  if (status === "Almost there") return "bg-amber-50 text-amber-800";
  if (status === "Birthday saved") return "bg-violet-50 text-violet-700";
  return "bg-slate-100 text-slate-600";
}

export function formatCustomerWalletStatus(customer) {
  const value = pickFirst(customer.walletPassStatus, customer.passStatus, "Active");
  return String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function customerWasScannedToday(customer, now = new Date()) {
  if (customer.scannedToday || customer.hasScannedToday) return true;
  const timestamp = pickFirst(customer.lastScannedAt, customer.lastScanAt, customer.lastScannerScanAt);
  if (!timestamp) return false;
  const date = new Date(timestamp);
  return !Number.isNaN(date.getTime()) && date.toDateString() === now.toDateString();
}

export function supportsScannedTodayFilter(customers) {
  return customers.some((customer) =>
    ["scannedToday", "hasScannedToday", "lastScannedAt", "lastScanAt", "lastScannerScanAt"]
      .some((field) => customer[field] !== undefined && customer[field] !== null),
  );
}

export function getVisibleCustomers(customers, status) {
  return status === "scanned_today" ? customers.filter((customer) => customerWasScannedToday(customer)) : customers;
}

export function getCustomerDetailFields(customer, birthdayRewardsEnabled = false) {
  return [
    ["Email", customer.email || "No email saved"],
    ["Joined", formatCustomerDate(customer.joinedDate)],
    birthdayRewardsEnabled ? ["Birthday", formatCustomerBirthday(customer)] : null,
    ["Loyalty card", formatCustomerWalletStatus(customer)],
    ["Reward threshold", `${Number(customer.rewardThreshold ?? 10) || 10} stamps`],
    ["Last activity", formatCustomerDate(customer.lastUpdated)],
  ].filter(Boolean);
}
