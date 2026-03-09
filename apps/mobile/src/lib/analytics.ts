export type MobileAnalyticsEvent =
  | "login_success"
  | "sale_started"
  | "sale_completed"
  | "inventory_adjusted"
  | "validation_error"
  | "empty_state_action_clicked";

export function trackEvent(
  event: MobileAnalyticsEvent,
  payload: Record<string, unknown> = {},
) {
  if (!__DEV__) return;
  // Keep the contract typed even before a real analytics sink is wired in.
  console.info(`[mobile-analytics] ${event}`, payload);
}
