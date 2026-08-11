function first(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export function getActivityTimestamp(item) {
  return first(item.timestamp, item.createdAt, item.created_at, item.occurredAt, item.scannedAt, item.updatedAt, item.date);
}

export function getActivityText(item) {
  return [
    item.type, item.eventType, item.action, item.event, item.kind, item.result,
    item.status, item.rewardType, item.reward_type, item.rewardName,
    item.reward_name, item.title, item.description, item.message,
  ].filter(Boolean).join(" ").toLowerCase();
}

export function getActivityCustomerName(item) {
  return first(
    item.customerName,
    item.customer_name,
    item.name,
    item.customer?.name,
    item.customer?.fullName,
    item.customer?.firstName && item.customer?.lastName
      ? `${item.customer.firstName} ${item.customer.lastName}`
      : null,
    item.customer?.firstName,
    item.email,
  );
}

export function classifyActivity(item, birthdayRewardsEnabled = false) {
  const text = getActivityText(item);
  const reward = text.includes("reward") || text.includes("redeem");
  if (birthdayRewardsEnabled && reward && text.includes("birthday")) return "birthday";
  if (text.includes("stamp") || text.includes("+1")) return "stamp";
  if (reward) return "reward";
  if (text.includes("reminder") || text.includes("notification")) return "reminder";
  if (text.includes("join") || text.includes("signup") || text.includes("sign up") || text.includes("customer_created") || text.includes("customer created")) return "join";
  if (text.includes("pass") || text.includes("wallet")) return "wallet";
  return "activity";
}

function titleCase(value) {
  return String(value || "Activity").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatActivityTitle(item, birthdayRewardsEnabled = false) {
  const text = getActivityText(item);
  const type = classifyActivity(item, birthdayRewardsEnabled);
  if (type === "birthday") return text.includes("activat") ? "Birthday reward activated" : "Birthday reward redeemed";
  if (type === "reward") return text.includes("redeem") ? "Reward redeemed" : "Reward earned";
  if (type === "stamp") return "Stamp added";
  if (type === "reminder") return text.includes("sent") ? "Reminder sent" : "Loyalty reminder";
  if (type === "join") return "Customer joined";
  if (type === "wallet") return text.includes("creat") ? "Loyalty card created" : "Loyalty card updated";
  return first(item.title, item.description, item.message, titleCase(first(item.type, item.eventType, item.action, item.event, item.kind)));
}

export function formatActivityBadge(item, birthdayRewardsEnabled = false) {
  return {
    birthday: "Birthday",
    stamp: "Stamp",
    reward: "Redeemed",
    reminder: "Reminder",
    join: "Joined",
    wallet: "Card",
    activity: titleCase(first(item.type, item.eventType, item.action, item.event, item.kind)),
  }[classifyActivity(item, birthdayRewardsEnabled)];
}

export function formatActivityDetail(item) {
  const customer = getActivityCustomerName(item);
  const type = classifyActivity(item);
  if (customer && type === "stamp") {
    const before = Number(first(item.balanceBefore, item.balance_before));
    const after = Number(first(item.balanceAfter, item.balance_after));
    if (Number.isFinite(before) && Number.isFinite(after)) return `${customer} · ${before} → ${after} stamps`;
    const current = Number(first(item.currentStamps, item.stamps, item.stampCount, item.customer?.currentStamps, item.result?.currentStamps));
    const threshold = Number(first(item.rewardThreshold, item.threshold, item.customer?.rewardThreshold, item.result?.rewardThreshold));
    const progress = Number.isFinite(current) && Number.isFinite(threshold) && threshold > 0 ? ` · ${current}/${threshold} stamps` : "";
    return `${customer}${progress}`;
  }
  return customer || (type === "reminder" ? "Loyalty reminder" : titleCase(first(item.type, item.eventType, item.action, item.event, item.kind)));
}

export function formatActivityTime(timestamp) {
  if (!timestamp) return "Recent";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function filterActivityRows(rows, filter, now = new Date()) {
  if (filter === "all") return rows;
  const start = new Date(now);
  if (filter === "today") start.setHours(0, 0, 0, 0);
  if (filter === "7_days") start.setDate(start.getDate() - 7);
  if (filter === "30_days") start.setDate(start.getDate() - 30);
  return rows.filter((item) => {
    const date = new Date(getActivityTimestamp(item));
    return !Number.isNaN(date.getTime()) && date >= start && date <= now;
  });
}
