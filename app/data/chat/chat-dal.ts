import { db } from "@/db";
import {
  conversations,
  conversationParticipants,
  user as userTable,
  messages,
} from "@/db/schema";
import { eq, and, desc, lt, asc, inArray, isNull } from "drizzle-orm";
import { requireUser } from "@/app/data/user/require-user";
import { v4 as uuidv4 } from "uuid";
import { createChatSchema, CreateChatInput } from "./chat-dto";
import { canAccessConversation, canDeleteConversation } from "./chat-policy";
import { decryptData } from "@/lib/crypto/decrypt";
import { base64ToBuffer } from "@/lib/crypto/encoding";

export class ChatDal {
  private constructor(private readonly currentUser: { id: string }) {}

  static async create() {
    const user = await requireUser();
    return new ChatDal(user);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * جلب قائمة المحادثات (Sidebar)
   */
  async getMyConversations() {
    return await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, this.currentUser.id),
      with: {
        conversation: {
          with: {
            participants: { with: { user: true } },
            messages: {
              where: isNull(messages.deletedAt),
              orderBy: desc(messages.createdAt),
              limit: 1,
            },
          },
        },
      },
      orderBy: desc(conversationParticipants.updatedAt),
    });
  }

  async getConversationById(id: string) {
    return await db.query.conversationParticipants.findFirst({
      where: eq(conversationParticipants.conversationId, id),
      with: {
        conversation: {
          with: {
            participants: { with: { user: true } },
            messages: {
              where: isNull(messages.deletedAt),
              orderBy: desc(messages.createdAt),
              limit: 1,
            },
          },
        },
      },
      orderBy: desc(conversationParticipants.updatedAt),
    });
  }

  /**
   * إنشاء محادثة (Direct أو Group)
   */
  async createChat(input: CreateChatInput) {
    const validated = createChatSchema.parse(input);
    const currentUserId = this.currentUser.id;

    // --- Direct Chat Logic ---
    if (validated.type === "direct") {
      if (!validated.username)
        throw new Error("Username required for direct chat");

      const targetUser = await db.query.user.findFirst({
        where: eq(userTable.name, validated.username.toLowerCase()),
      });

      if (!targetUser) throw new Error("Target user not found");
      if (targetUser.id === currentUserId)
        throw new Error("Cannot chat with yourself");

      const sortedIds = [currentUserId, targetUser.id].sort();
      const directKey = `dm:${sortedIds[0]}_${sortedIds[1]}`;

      return await db.transaction(async (tx) => {
        const existing = await tx.query.conversations.findFirst({
          where: eq(conversations.directKey, directKey),
        });
        if (existing) return { id: existing.id };

        const newId = uuidv4();
        await tx
          .insert(conversations)
          .values({ id: newId, type: "direct", directKey });
        await tx.insert(conversationParticipants).values([
          { id: uuidv4(), conversationId: newId, userId: currentUserId },
          { id: uuidv4(), conversationId: newId, userId: targetUser.id },
        ]);
        return { id: newId };
      });
    }

    // --- Group Chat Logic ---
    if (validated.type === "group") {
      if (!validated.title) throw new Error("Group title is required");

      const newId = uuidv4();
      await db.transaction(async (tx) => {
        await tx.insert(conversations).values({
          id: newId,
          type: "group",
          title: validated.title,
        });
        await tx.insert(conversationParticipants).values({
          id: uuidv4(),
          conversationId: newId,
          userId: currentUserId,
          role: "admin", // منشئ المجموعة هو الآدمن
        });
      });
      return { id: newId };
    }

    throw new Error("Invalid chat type");
  }

  /**
   * جلب الرسائل مع Pagination (Cursor-based)
   */
  async getMessages(
    conversationId: string,
    limit: number = 20,
    cursorId?: string,
  ) {
    // التحقق من الصلاحية
    if (!(await canAccessConversation(this.currentUser.id, conversationId))) {
      throw new Error("Unauthorized");
    }

    let whereClause;
    if (cursorId) {
      const cursorMessage = await db.query.messages.findFirst({
        where: eq(messages.id, cursorId),
      });
      if (!cursorMessage) return [];

      whereClause = and(
        eq(messages.conversationId, conversationId),
        lt(messages.createdAt, cursorMessage.createdAt),
      );
    } else {
      whereClause = eq(messages.conversationId, conversationId);
    }

    const results = await db.query.messages.findMany({
      where: whereClause,
      orderBy: desc(messages.createdAt),
      limit,
    });

    return results.reverse(); // لإعطاء الترتيب الزمني الصحيح للواجهة
  }

  // داخل كلاس ChatDal
  async getMessageById(messageId: string) {
    // نحن هنا نستخدم prisma لجلب الرسالة
    // تأكد من أن الـ DAL لديه الوصول لـ prisma
    return await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });
  }

  async getDecryptedMessages(params: {
    conversationId: string;
    limit?: number;
    cursorId?: string;
    sharedKey: CryptoKey; // مرر المفتاح هنا لفك التشفير في السيرفر (Edge runtime)
  }) {
    const { conversationId, limit = 20, cursorId, sharedKey } = params;

    // 1. جلب الرسائل الخام من الداتابيز (استخدم الدالة التي كتبناها سابقاً)
    const rawMessages = await this.getMessages(conversationId, limit, cursorId);
    console.log("rawMessages", rawMessages);
    // 2. فك التشفير (بافتراض وجود دوال التشفير في السيرفر أيضاً)
    const decrypted = await Promise.all(
      rawMessages.map(async (msg) => {
        try {
          const content = await decryptData(
            base64ToBuffer(msg.content!),
            sharedKey,
            new Uint8Array(base64ToBuffer(msg.iv!)),
          );
          return {
            id: msg.id,
            content: content as string,
            senderId: msg.senderId,
            createdAt: msg.createdAt.toISOString(),
          };
        } catch {
          return null;
        }
      }),
    );

    return decrypted.filter((m) => m !== null);
  }

  /**
   * إرسال رسالة
   */
  async sendMessage(payload: {
    conversationId: string;
    ciphertext: string;
    iv: string;
  }) {
    if (
      !(await canAccessConversation(
        this.currentUser.id,
        payload.conversationId,
      ))
    ) {
      throw new Error("Unauthorized");
    }

    const messageId = uuidv4();
    await db.transaction(async (tx) => {
      await tx.insert(messages).values({
        id: messageId,
        conversationId: payload.conversationId,
        senderId: this.currentUser.id,
        type: "text",
        content: payload.ciphertext,
        iv: payload.iv,
        createdAt: new Date(),
      });

      await tx
        .update(conversations)
        .set({ lastMessageId: messageId })
        .where(eq(conversations.id, payload.conversationId));

      // تحديث توقيت المحادثة لرفعها للأعلى في القائمة
      await tx
        .update(conversationParticipants)
        .set({ updatedAt: new Date() })
        .where(
          eq(conversationParticipants.conversationId, payload.conversationId),
        );
    });

    return { success: true, messageId };
  }

  /**
   * تحديث آخر رسالة مقروءة
   */
  async markAsRead(conversationId: string, messageId: string) {
    await db
      .update(conversationParticipants)
      .set({ lastReadMessageId: messageId })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, this.currentUser.id),
        ),
      );
  }

  /**
   * حذف محادثة
   */
  async deleteChat(conversationId: string) {
    if (!(await canDeleteConversation(this.currentUser.id, conversationId))) {
      throw new Error("Only admins can delete this conversation");
    }

    await db.delete(conversations).where(eq(conversations.id, conversationId));
  }

  async editMessage(payload: {
    messageId: string;
    ciphertext: string;
    iv: string;
  }) {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, payload.messageId),
    });

    if (!message) throw new Error("Message not found");
    if (message.senderId !== this.currentUser.id)
      throw new Error("Unauthorized: you can only edit your own messages");

    await db
      .update(messages)
      .set({
        content: payload.ciphertext,
        iv: payload.iv,
        editedAt: new Date(),
      })
      .where(eq(messages.id, payload.messageId));

    return { success: true };
  }

  /**
   * حذف رسائل متعددة (soft delete - فقط رسائلك أنت)
   */
  async deleteMessages(messageIds: string[]) {
    if (messageIds.length === 0) return { success: true, deleted: 0 };
    console.log("messageIds", messageIds);
    // تحقق أن كل الرسائل تخص المستخدم الحالي
    const foundMessages = await db.query.messages.findMany({
      where: and(
        inArray(messages.id, messageIds),
        eq(messages.senderId, this.currentUser.id),
      ),
    });

    if (foundMessages.length !== messageIds.length) {
      throw new Error(
        "Unauthorized: some messages don't belong to you or are already deleted",
      );
    }

    // Soft delete: set deletedAt
    const message = await db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(inArray(messages.id, messageIds))
      .returning();
    console.log("deleted", message);
    return { success: true, deleted: foundMessages.length };
  }
}
