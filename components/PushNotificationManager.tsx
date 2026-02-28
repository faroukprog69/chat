"use client";

import { useState, useEffect } from "react";
import { subscribeUser, unsubscribeUser } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification03Icon,
  NotificationOff01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });
      setSubscription(sub);
      const serializedSub = JSON.parse(JSON.stringify(sub));
      await subscribeUser(serializedSub);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setLoading(true);
    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      await unsubscribeUser();
    } finally {
      setLoading(false);
    }
  }

  /* ── Not supported ── */
  if (!isSupported) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
          <HugeiconsIcon icon={Alert01Icon} size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Not Supported
          </p>
          <p className="mt-0.5 text-sm text-amber-700/70 dark:text-amber-500/70">
            Push notifications are not supported in this browser.
          </p>
        </div>
      </div>
    );
  }

  /* ── Subscribed ── */
  if (subscription) {
    return (
      <div className="flex flex-col gap-4">
        {/* Status badge */}
        <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
            <HugeiconsIcon icon={Notification03Icon} size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Notifications Enabled
            </p>
            <p className="mt-0.5 text-sm text-green-700/70 dark:text-green-500/70">
              You'll receive instant alerts for new messages.
            </p>
          </div>
          {/* Live indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
        </div>

        <Button
          variant="outline"
          onClick={unsubscribeFromPush}
          disabled={loading}
          className="w-fit gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
        >
          <HugeiconsIcon icon={NotificationOff01Icon} size={16} />
          {loading ? "Unsubscribing…" : "Disable Notifications"}
        </Button>
      </div>
    );
  }

  /* ── Not subscribed ── */
  return (
    <div className="flex flex-col gap-4">
      {/* Status badge */}
      <div className="flex items-center gap-3 rounded-xl border border-muted bg-muted/30 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <HugeiconsIcon icon={NotificationOff01Icon} size={18} />
        </div>
        <div>
          <p className="text-sm font-medium">Notifications Disabled</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Enable notifications to stay updated on new messages.
          </p>
        </div>
      </div>

      <Button
        onClick={subscribeToPush}
        disabled={loading}
        className="w-fit gap-2"
      >
        <HugeiconsIcon icon={Notification03Icon} size={16} />
        {loading ? "Enabling…" : "Enable Notifications"}
      </Button>
    </div>
  );
}

export default PushNotificationManager;
