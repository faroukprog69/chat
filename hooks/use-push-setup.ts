"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
} from "@/lib/push";

export function usePushSetup() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      console.log("🔧 Setting up push for user:", session.user.id);
      // Register SW
      registerServiceWorker();

      // Request permission and subscribe
      requestNotificationPermission().then((granted) => {
        console.log(
          "🔔 Notification permission:",
          granted ? "granted" : "denied",
        );
        if (granted) {
          subscribeToPush();
        }
      });
    }
  }, [session?.user]);
}
