'use server'

import webpush from 'web-push'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function subscribeUser(sub: PushSubscription) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Upsert subscription
  await db
    .insert(pushSubscriptions)
    .values({
      id: `${session.user.id}-${sub.endpoint}`,
      userId: session.user.id,
      subscription: sub,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.id,
      set: {
        subscription: sub,
        updatedAt: new Date(),
      },
    })

  return { success: true }
}

export async function unsubscribeUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, session.user.id))

  return { success: true }
}

export async function sendNotification(message: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('No user session')
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, session.user.id))

  if (subscriptions.length === 0) {
    throw new Error('No subscription available')
  }

  const promises = subscriptions.map((sub) =>
    webpush.sendNotification(
      sub.subscription as any,
      JSON.stringify({
        title: 'Test Notification',
        body: message,
        icon: '/icon.png',
      })
    )
  )

  await Promise.all(promises)

  return { success: true }
}
