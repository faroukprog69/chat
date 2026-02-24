import { create } from "zustand";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface MessagesStore {
  cache: Record<string, Message[]>;
  setMessages: (conversationId: string, messages: Message[]) => void;
  getMessages: (conversationId: string) => Message[] | undefined;
  // ✅ إضافة دوال مساعدة للتعامل مع الـ cache بشكل آمن
  addMessage: (conversationId: string, message: Message) => void;
  getLastMessage: (conversationId: string) => Message | undefined;
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

  // ✅ جلب آخر رسالة في محادثة
  getLastMessage: (conversationId) => {
    const messages = get().cache[conversationId];
    if (!messages || messages.length === 0) return undefined;
    return messages[messages.length - 1];
  },
}));
