/**
 * Push notification → deep-link handler.
 *
 * Requires expo-notifications to be installed:
 *   npx expo install expo-notifications
 *
 * Also add to app.json plugins:
 *   ["expo-notifications", { "icon": "./assets/notification-icon.png" }]
 *
 * The backend sends notification `data` objects matching NotificationPayload
 * from @/src/lib/workflows.ts.  This hook:
 *  1. Registers an in-app (foreground) notification handler.
 *  2. Listens for notification response events (user taps a notification
 *     while app is backgrounded/killed) and routes to the right screen.
 *
 * If expo-notifications is not installed the hook is a silent no-op.
 */

import { useEffect, useRef } from "react";
import { isNotificationPayload, type NotificationPayload } from "@/src/lib/workflows";

// ─── Navigation callbacks ────────────────────────────────────────────────────

export type NotificationNavigationHandlers = {
  openSaleDetail: (saleId: string) => void;
  openApproval: (approvalId: string) => void;
  openStockFocus: (opts: { productVariantId?: string; variantName?: string; productName?: string }) => void;
  openReplenishment: (suggestionId: string) => void;
  openTasksTab: () => void;
};

// ─── Routing logic ───────────────────────────────────────────────────────────

function routeNotification(
  payload: NotificationPayload,
  handlers: NotificationNavigationHandlers,
) {
  switch (payload.kind) {
    case "sale":
      handlers.openSaleDetail(payload.saleId);
      break;
    case "approval":
      handlers.openApproval(payload.approvalId);
      break;
    case "low-stock":
      handlers.openStockFocus({
        productVariantId: payload.variantId,
        variantName: payload.variantName,
        productName: payload.productName,
      });
      break;
    case "replenishment":
      handlers.openReplenishment(payload.suggestionId);
      break;
    case "stock-count":
      handlers.openTasksTab();
      break;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Mount this hook once in AppShell after the user is authenticated.
 * It registers foreground + background notification listeners and routes
 * tapped notifications to the correct screen via `handlers`.
 */
export function useNotificationHandler(
  isAuthenticated: boolean,
  handlers: NotificationNavigationHandlers,
) {
  // Keep a stable ref so listener callbacks always call current handlers
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    // Lazy-require so the module doesn't crash when not installed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Notifications: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Notifications = require("expo-notifications");
    } catch {
      // expo-notifications not installed — silent no-op
      return;
    }

    // Show notifications as banners even when app is in foreground
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Handle notification taps (user presses on a notification)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (response: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const data: unknown = response?.notification?.request?.content?.data;
        if (isNotificationPayload(data)) {
          routeNotification(data, handlersRef.current);
        }
      },
    );

    // Handle initial notification (app launched from a push tap while killed)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void Notifications.getLastNotificationResponseAsync().then((response: any) => {
      if (!response) return;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const data: unknown = response?.notification?.request?.content?.data;
      if (isNotificationPayload(data)) {
        routeNotification(data, handlersRef.current);
      }
    });

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      responseSubscription?.remove?.();
    };
  }, [isAuthenticated]);
}
