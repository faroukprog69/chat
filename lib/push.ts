"use client";

/**
 * Register the service worker
 */
export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("SW registered:", registration);
      return registration;
    } catch (error) {
      console.error("SW registration failed:", error);
    }
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications.");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush() {
  try {
    console.log("📡 Attempting to subscribe to push notifications...");
    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("❌ VAPID public key not found");
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("📡 Subscription obtained:", subscription.endpoint);

    // Send subscription to server
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscription }),
    });

    if (!response.ok) {
      throw new Error("Failed to save subscription");
    }

    console.log("✅ Push subscription saved successfully");
  } catch (error) {
    console.error("❌ Push subscription failed:", error);
  }
}

/**
 * Utility to convert VAPID key
 */
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
