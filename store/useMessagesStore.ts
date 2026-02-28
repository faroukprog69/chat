import { create } from "zustand";
import { LocalMessage } from "@/app/data/chat/chat-dto";

interface MessagesStore {
  cache: Record<string, LocalMessage[]>;
  setMessages: (conversationId: string, messages: LocalMessage[]) => void;
  getMessages: (conversationId: string) => LocalMessage[] | undefined;
  // ✅ إضافة دوال مساعدة للتعامل مع الـ cache بشكل آمن
  addMessage: (conversationId: string, message: LocalMessage) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<LocalMessage>,
  ) => void;
  deleteMessage: (conversationId: string, messageIds: string[]) => void;
  deleteConversation: (conversationId: string) => void;
  getLastMessage: (conversationId: string) => LocalMessage | undefined;
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  cache: {},
  setMessages: (conversationId, messages) =>
    set((state) => ({ cache: { ...state.cache, [conversationId]: messages } })),
  getMessages: (conversationId) => get().cache[conversationId],

  // ✅ إضافة رسالة واحدة مع منع التكرار
  addMessage: (conversationId, message) =>
    set((state) => {
      const currentMessages = state.cache[conversationId] || [];
      // تجنب تكرار الرسائل
      if (currentMessages.find((m) => m.id === message.id)) {
        return state;
      }
      return {
        cache: {
          ...state.cache,
          [conversationId]: [...currentMessages, message],
        },
      };
    }),
  // ✅ تحديث رسالة موجودة
  updateMessage: (conversationId, messageId, updates) =>
    set((state) => {
      const currentMessages = state.cache[conversationId] || [];
      const updatedMessages = currentMessages.map((m) =>
        m.id === messageId ? { ...m, ...updates } : m,
      );
      return {
        cache: {
          ...state.cache,
          [conversationId]: updatedMessages,
        },
      };
    }),
  deleteMessage: (conversationId, messageIds) =>
    set((state) => {
      const currentMessages = state.cache[conversationId] || [];
      const updatedMessages = currentMessages.map((m) =>
        messageIds.includes(m.id) ? { ...m, deletedAt: new Date() } : m,
      );
      return {
        cache: {
          ...state.cache,
          [conversationId]: updatedMessages,
        },
      };
    }),
  deleteConversation: (conversationId) =>
    set((state) => ({
      cache: { ...state.cache, [conversationId]: [] },
    })),
  // ✅ جلب آخر رسالة في محادثة
  getLastMessage: (conversationId) => {
    const messages = get().cache[conversationId];
    if (!messages || messages.length === 0) return undefined;
    return messages[messages.length - 1];
  },
}));
