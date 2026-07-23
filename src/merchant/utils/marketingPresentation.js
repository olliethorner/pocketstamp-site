export function getReminderStats(summary) {
  return {
    sentThisMonth: summary?.sentThisMonth ?? 0,
    scheduled: summary?.scheduled ?? 0,
  };
}

export function getReminderBehaviours(birthdayRewardsEnabled) {
  return [
    ["Halfway reminder", "A timely reminder when a customer reaches the halfway point."],
    ["Almost-there reminder", "A nudge when a customer is close to their next reward."],
    ["Reward-ready reminder", "Lets a customer know when their reward is ready."],
    [
      "Birthday reminder",
      birthdayRewardsEnabled
        ? "Birthday rewards are enabled for this loyalty programme."
        : "Available when birthday rewards are enabled for the loyalty programme.",
    ],
    ["Win-back reminder", "A gentle prompt after a period without a visit."],
  ];
}

export function canCancelCampaign(campaign, canManage) {
  return Boolean(canManage && campaign?.status === "scheduled");
}
