import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Configure VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url: string; icon?: string },
) {
  try {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    console.log(
      `📱 Found ${subscriptions.length} subscriptions for user ${userId}`,
    );

    const promises = subscriptions.map((sub) =>
      webpush
        .sendNotification(sub.subscription as any, JSON.stringify(payload))
        .then(() => {
          console.log(`✅ Push sent successfully to user ${userId}`);
        })
        .catch(async (err) => {
          console.error(`❌ Error sending push to user ${userId}:`, err);
          // If subscription expired, delete it
          if (err.statusCode === 410) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
            console.log(`🗑️ Deleted expired subscription for user ${userId}`);
          }
        }),
    );

    await Promise.all(promises);
  } catch (error) {
    console.error("Error in sendPushNotification:", error);
  }
}
