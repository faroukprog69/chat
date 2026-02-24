"use server";

import { db } from "@/db";
import {
  conversations,
  conversationParticipants,
  user,
  messages,
} from "@/db/schema";
import { decryptData } from "@/lib/crypto/decrypt";
import { base64ToBuffer } from "@/lib/crypto/encoding";
import { deriveSharedSecret } from "@/lib/crypto/exchange";
import { and, asc, desc, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

/**
 * إنشاء محادثة ثنائية (Direct Message)
 */
type CreateChatResult =
  | { success: true; conversationId: string }
  | { success: false; error: string };

export async function createChatAction(data: {
  type: "direct" | "group";
  userId: string;
  username?: string;
  title?: string;
}): Promise<CreateChatResult> {
  const currentUserId = data.userId;

  try {
    // --- حالة المحادثة المباشرة (Direct) ---
    if (data.type === "direct") {
      if (!data.username)
        return { success: false, error: "Username is required" };

      // 1. البحث عن المستخدم المستهدف
      const targetUser = await db.query.user.findFirst({
        where: eq(user.name, data.username),
      });

      if (!targetUser) return { success: false, error: "User not found" };
      if (targetUser.id === currentUserId)
        return { success: false, error: "You cannot chat with yourself" };

      // 2. توليد المفتاح الفريد (ترتيب الـ IDs أبجدياً لضمان الثبات)
      const sortedIds = [currentUserId, targetUser.id].sort();
      const directKey = `dm:${sortedIds[0]}_${sortedIds[1]}`;

      // 3. محاولة إدخال المحادثة (سيتم تجاهلها أو جلبها إذا كانت موجودة بفضل الـ Index الفريد)
      return await db.transaction(async (tx) => {
        // التحقق أولاً إذا كانت موجودة
        const existing = await tx.query.conversations.findFirst({
          where: eq(conversations.directKey, directKey),
        });

        if (existing) return { success: false, error: "Chat already exists" };

        const newId = uuidv4();
        await tx.insert(conversations).values({
          id: newId,
          type: "direct",
          directKey: directKey,
        });

        await tx.insert(conversationParticipants).values([
          { id: uuidv4(), conversationId: newId, userId: currentUserId },
          { id: uuidv4(), conversationId: newId, userId: targetUser.id },
        ]);
        revalidatePath("/chat");

        return { success: true, conversationId: newId };
      });
    }

    // --- حالة المجموعة (Group) ---
    if (data.type === "group") {
      if (!data.title)
        return { success: false, error: "Group title is required" };

      const newId = uuidv4();
      await db.transaction(async (tx) => {
        await tx.insert(conversations).values({
          id: newId,
          type: "group",
          title: data.title,
        });

        // منشئ المجموعة يصبح Admin تلقائياً
        await tx.insert(conversationParticipants).values({
          id: uuidv4(),
          conversationId: newId,
          userId: currentUserId,
          role: "admin",
        });
      });
      revalidatePath("/chat");
      return { success: true, conversationId: newId };
    }

    return { success: false, error: "Invalid chat type" };
  } catch (error) {
    console.error("Chat Action Error:", error);
    return { success: false, error: "Internal server error" };
  }
}
/**
 * جلب قائمة المحادثات للمستخدم (للسيدبار)
 */
export async function getMyConversations(userId: string) {
  return await db.query.conversationParticipants.findMany({
    where: eq(conversationParticipants.userId, userId),
    with: {
      conversation: {
        with: {
          participants: {
            with: {
              user: true,
            },
          },
          messages: { orderBy: desc(messages.createdAt), limit: 1 },
        },
      },
    },
    orderBy: desc(conversationParticipants.updatedAt),
  });
}

export type Conversations = Awaited<ReturnType<typeof getMyConversations>>;
export type ConversationParticipantEntry = Conversations[number];

export async function getMessagesByConversationId(
  conversationId: string,
  offset: number = 0,
  limit: number = 20,
) {
  const messages1 = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: desc(messages.createdAt),
    limit,
    offset,
  });

  return messages1.reverse(); // الآن الأقدم أولًا
}

export async function getOlderMessages(
  conversationId: string,
  oldestMessageId: string,
  limit: number = 20,
) {
  const oldestMessage = await db.query.messages.findFirst({
    where: eq(messages.id, oldestMessageId),
  });

  if (!oldestMessage) return [];

  const olderMessages = await db.query.messages.findMany({
    where: and(
      eq(messages.conversationId, conversationId),
      lt(messages.createdAt, oldestMessage.createdAt),
    ),
    orderBy: desc(messages.createdAt),
    limit,
  });

  return olderMessages.reverse(); // الأقدم أولًا
}

export async function updateLastReadMessage({
  conversationId,
  messageId,
}: {
  conversationId: string;
  messageId: string;
}) {
  const updated = await db
    .update(conversationParticipants)
    .set({
      lastReadMessageId: messageId,
    })
    .where(eq(conversationParticipants.conversationId, conversationId));

  revalidatePath("/chat");
}

export async function sendMessageToDbAction(payload: {
  id: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;
  iv: string;
}) {
  try {
    // 1. التحقق من الجلسة (أمان إضافي)

    // 2. إدخال الرسالة في Neon
    await db.insert(messages).values({
      id: payload.id,
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      type: "text",
      content: payload.ciphertext,
      iv: payload.iv,
      createdAt: new Date(),
    });

    await db
      .update(conversations)
      .set({
        lastMessageId: payload.id,
      })
      .where(eq(conversations.id, payload.conversationId));

    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to store message" };
  }
}

export async function getMessage({ messageId }: { messageId: string }) {
  const msg = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  });

  if (!msg) return null;

  return msg;
}
