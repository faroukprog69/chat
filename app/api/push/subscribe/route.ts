import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      console.log("❌ No session for push subscribe");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔑 Session user for subscribe:", session.user.id);

    const body = await request.json();
    const { subscription } = body;

    if (!subscription) {
      console.log("❌ No subscription in body");
      return NextResponse.json(
        { error: "No subscription provided" },
        { status: 400 },
      );
    }

    console.log(
      "💾 Saving subscription for user:",
      session.user.id,
      "endpoint:",
      subscription.endpoint,
    );

    // Upsert subscription
    await db
      .insert(pushSubscriptions)
      .values({
        id: `${session.user.id}-${subscription.endpoint}`,
        userId: session.user.id,
        subscription,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.id,
        set: {
          subscription,
          updatedAt: new Date(),
        },
      });

    console.log("✅ Subscription saved for user:", session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error saving subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
