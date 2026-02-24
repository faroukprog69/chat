import { ConversationParticipantEntry } from "@/app/actions/chat";
import { useMessagesStore } from "@/store/useMessagesStore";

/**
 * التحقق من وجود رسائل غير مقروءة في محادثة
 * @param conversation - بيانات المحادثة والمشاركين
 * @param currentUserId - ID المستخدم الحالي
 * @param checkCache - هل يجب التحقق من الـ cache المحلية (default: true)
 * @returns boolean - true إذا كانت هناك رسائل غير مقروءة
 */
export function hasUnreadMessages(
  conversation: ConversationParticipantEntry,
  currentUserId: string,
  checkCache: boolean = true,
): boolean {
  // 1. التحقق من وجود رسائل في المحادثة
  if (
    !conversation.conversation.messages ||
    conversation.conversation.messages.length === 0
  ) {
    return false;
  }

  // 2. جلب آخر رسالة (الأحدث)
  const lastMessage = conversation.conversation.messages[0];

  // 3. التحقق من أن الرسالة ليست من المستخدم الحالي
  if (lastMessage.senderId === currentUserId) {
    return false;
  }

  // 4. التحقق من الـ cache المحلية إذا مطلوب
  if (checkCache) {
    const { getMessages } = useMessagesStore.getState();
    const cachedMessages = getMessages(conversation.conversation.id);

    if (cachedMessages && cachedMessages.length > 0) {
      const lastCachedMessage = cachedMessages[cachedMessages.length - 1];

      // إذا كانت آخر رسالة في الـ cache هي نفسها في الـ conversation
      // وكان المستخدم هو من أرسلها، فلا يوجد unread
      if (
        lastCachedMessage.id === lastMessage.id &&
        lastCachedMessage.senderId === currentUserId
      ) {
        return false;
      }

      // إذا كان lastReadMessageId يطابق آخر رسالة في الـ cache
      if (conversation.lastReadMessageId === lastCachedMessage.id) {
        return false;
      }
    }
  }

  // 5. التحقق من lastReadMessageId
  // إذا كان null أو undefined، فهناك رسائل غير مقروءة (باستثناء رسائل المستخدم نفسه)
  if (!conversation.lastReadMessageId) {
    return true;
  }

  // 6. مقارنة IDs للتحقق من وجود رسائل جديدة
  return lastMessage.id !== conversation.lastReadMessageId;
}

/**
 * دالة محسنة للتحقق من الرسائل غير المقروءة مع التركيز على الأداء والـ cache
 */
export function hasUnreadMessagesOptimized(
  conversation: ConversationParticipantEntry,
  currentUserId: string,
): boolean {
  const { getLastMessage } = useMessagesStore.getState();
  const conversationId = conversation.conversation.id;

  // جلب آخر رسالة من الـ cache أولاً (أسرع)
  const lastCachedMessage = getLastMessage(conversationId);

  if (lastCachedMessage) {
    // إذا كانت الرسالة من المستخدم الحالي
    if (lastCachedMessage.senderId === currentUserId) {
      return false;
    }

    // مقارنة مع lastReadMessageId
    if (conversation.lastReadMessageId === lastCachedMessage.id) {
      return false;
    }

    // إذا لم يكن هناك lastReadMessageId
    if (!conversation.lastReadMessageId) {
      return true;
    }

    // التحقق إذا كانت الرسالة أحدث من lastReadMessageId
    return lastCachedMessage.id !== conversation.lastReadMessageId;
  }

  // الرجوع للبيانات الأساسية
  if (!conversation.conversation.messages?.length) {
    return false;
  }

  const lastMessage = conversation.conversation.messages[0];

  if (lastMessage.senderId === currentUserId) {
    return false;
  }

  if (!conversation.lastReadMessageId) {
    return true;
  }

  return lastMessage.id !== conversation.lastReadMessageId;
}
