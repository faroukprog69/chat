import { ConversationParticipantEntry } from "@/app/actions/chat";
import { useMessagesStore } from "@/store/useMessagesStore";
import { LocalMessage } from "@/app/data/chat/chat-dto";

/**
 * التحقق من وجود رسائل غير مقروءة في محادثة
 * @param conversation - بيانات المحادثة والمشاركين
 * @param currentUserId - ID المستخدم الحالي
 * @returns boolean - true إذا كانت هناك رسائل غير مقروءة
 */
export function hasUnreadMessages(
  conversation: ConversationParticipantEntry,
  currentUserId: string,
  isCurrentChat: boolean = false,
): boolean {
  if (isCurrentChat) return false;

  const lastMessageId = conversation.conversation.lastMessageId;

  if (!lastMessageId) return false;

  // إذا كانت آخر رسالة أرسلها المستخدم نفسه
  const lastMessage = conversation.conversation.messages?.find(
    (m) => m.id === lastMessageId,
  );

  if (lastMessage?.senderId === currentUserId) {
    return false;
  }

  if (!conversation.lastReadMessageId) {
    return true;
  }

  return lastMessageId !== conversation.lastReadMessageId;
}
