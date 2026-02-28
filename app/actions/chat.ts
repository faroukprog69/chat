"use server";
import { ChatDal } from "@/app/data/chat/chat-dal";
import { createChatSchema, LocalMessage } from "@/app/data/chat/chat-dto";
import { revalidatePath } from "next/cache";

/**
 * إنشاء محادثة جديدة
 */
export async function createChatAction(data: {
  type: "direct" | "group";
  userId?: string;
  username?: string;
  title?: string;
}) {
  try {
    const validatedData = createChatSchema.parse(data);
    const chatDal = await ChatDal.create();
    const result = await chatDal.createChat(validatedData);
    revalidatePath("/chat");
    return { success: true, conversationId: result.id };
  } catch (error: any) {
    console.error("Action Error:", error);
    return { success: false, error: error.message || "حدث خطأ ما" };
  }
}

/**
 * إرسال رسالة
 */
export async function sendMessageAction(payload: {
  conversationId: string;
  ciphertext: string;
  iv: string;
}) {
  try {
    const chatDal = await ChatDal.create();
    const result = await chatDal.sendMessage(payload);
    // revalidatePath(`/chat/${payload.conversationId}`);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * تعديل رسالة (فقط رسائلك أنت)
 */
export async function editMessageAction(payload: {
  messageId: string;
  ciphertext: string;
  conversationId: string;
  iv: string;
}) {
  try {
    const chatDal = await ChatDal.create();
    await chatDal.editMessage(payload);
    // revalidatePath(`/chat/${payload.conversationId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * حذف رسائل متعددة (فقط رسائلك أنت)
 */
export async function deleteMessagesAction(messageIds: string[]) {
  try {
    const chatDal = await ChatDal.create();
    const result = await chatDal.deleteMessages(messageIds);
    // revalidatePath(`/chat/${messageIds[0]}`);
    return { success: true, deleted: result.deleted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * حذف محادثة
 */
export async function deleteConversationAction(conversationId: string) {
  try {
    const chatDal = await ChatDal.create();
    await chatDal.deleteChat(conversationId);
    revalidatePath("/chat");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * جلب الرسائل مع Pagination
 */
export async function getMessagesAction(
  conversationId: string,
  cursorId?: string,
): Promise<LocalMessage[]> {
  const dal = await ChatDal.create();
  return await dal.getMessages(conversationId, 15, cursorId);
}
/**
 * تحديث حالة القراءة
 */
export async function updateReadStatusAction(
  conversationId: string,
  messageId: string,
) {
  const dal = await ChatDal.create();
  revalidatePath(`/chat/${conversationId}`);
  await dal.markAsRead(conversationId, messageId);
}

/**
 * جلب بيانات رسالة محددة
 */
export async function getMessageAction(messageId: string) {
  try {
    const chatDal = await ChatDal.create();
    return await chatDal.getMessageById(messageId);
  } catch (error) {
    console.error("Error fetching message:", error);
    return null;
  }
}

// تصدير النوع
export type ConversationParticipantEntry = {
  lastReadMessageId: string | null;
  conversation: {
    id: string;
    lastMessageId: string | null;
    avatar?: string | null;
    participants: Array<{
      userId: string;
      user: {
        publicKey: string | null;
        displayName: string | null;
      };
    }>;
    messages: LocalMessage[];
    type: "group" | "direct";
    title?: string | null;
  };
};
