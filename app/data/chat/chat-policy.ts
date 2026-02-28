import "server-only";
import { db } from "@/db";
import { conversationParticipants, conversations } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function canAccessConversation(
  userId: string,
  conversationId: string,
) {
  const participant = await db.query.conversationParticipants.findFirst({
    where: and(
      eq(conversationParticipants.userId, userId),
      eq(conversationParticipants.conversationId, conversationId),
    ),
  });
  return !!participant;
}

export async function canDeleteConversation(
  userId: string,
  conversationId: string,
) {
  const participant = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, conversationId)),
  });
  return !!participant;
}
