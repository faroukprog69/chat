"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ImageIcon,
  MoreVertical,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import {
  ConversationParticipantEntry,
  getMessagesByConversationId,
  updateLastReadMessage,
  getOlderMessages,
} from "@/app/actions/chat";
import { resolveConversationTitle } from "@/lib/utilites";
import { useChatChannel } from "@/realtime/use-channel";
import { CHANNELS } from "@/realtime/channels";
import { deriveSharedSecret } from "@/lib/crypto/exchange";
import { decryptData } from "@/lib/crypto/decrypt";
import { base64ToBuffer } from "@/lib/crypto/encoding";
import { useMessagesStore } from "@/store/useMessagesStore";

interface MessageBubbleProps {
  message: string;
  isUserMessage: boolean;
  name: string;
}

const MessageBubble = ({
  message,
  isUserMessage,
  name,
}: MessageBubbleProps) => (
  <div
    className={cn("flex items-start gap-3", isUserMessage ? "justify-end" : "")}
  >
    {!isUserMessage && (
      <Avatar className="h-8 w-8">
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
    )}
    <div
      className={cn(
        "max-w-[70%] rounded-lg p-3 bg-muted",
        isUserMessage
          ? "bg-primary text-primary-foreground rounded-br-none"
          : "rounded-bl-none",
      )}
    >
      <p className="text-sm">{message}</p>
    </div>
  </div>
);

interface ChatMainProps {
  currentUserId: string;
  conversation: ConversationParticipantEntry;
  privateKey: CryptoKey;
}

export function ChatMain({
  currentUserId,
  conversation,
  privateKey,
}: ChatMainProps) {
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [loadingOlderMap, setLoadingOlderMap] = useState<
    Record<string, boolean>
  >({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});

  const opponent = conversation.conversation.participants.find(
    (p) => p.userId !== currentUserId,
  );
  const opponentPublicKey = opponent?.user.publicKey;

  const { cache, setMessages, getMessages, addMessage } = useMessagesStore();

  // =========================
  // 1️⃣ تحميل الرسائل عند فتح المحادثة
  // =========================
  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      const cached = getMessages(conversation.conversation.id);
      if (cached && cached.length > 0 && mounted) {
        setLocalMessages(cached);
        return;
      }

      const msgs = await getMessagesByConversationId(
        conversation.conversation.id,
        0,
        20,
      );
      if (!privateKey || !opponentPublicKey) return;

      const sharedKey = await deriveSharedSecret(privateKey, opponentPublicKey);

      const decrypted = await Promise.all(
        msgs.map(async (msg) => {
          try {
            const content = await decryptData(
              base64ToBuffer(msg.content!),
              sharedKey,
              new Uint8Array(base64ToBuffer(msg.iv!)),
            );
            return { ...msg, content: content as string };
          } catch {
            return null;
          }
        }),
      );

      const filtered = decrypted.filter(
        (msg): msg is NonNullable<typeof msg> => msg !== null,
      );

      const messagesForStore = filtered.map((msg) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        createdAt: new Date(msg.createdAt).toISOString(),
      }));

      if (mounted) {
        setLocalMessages(filtered);
        setTimeout(() => {
          setMessages(conversation.conversation.id, messagesForStore);
        }, 0);

        setHasMoreMap((prev) => ({
          ...prev,
          [conversation.conversation.id]: filtered.length === 20,
        }));
      }
    }

    loadMessages();
    return () => {
      mounted = false;
    };
  }, [conversation.conversation.id, privateKey, opponentPublicKey]);

  // =========================
  // 2️⃣ تحميل رسائل أقدم
  // =========================
  const loadOlderMessages = async () => {
    const isLoadingOlder =
      loadingOlderMap[conversation.conversation.id] || false;
    const hasMoreMessages = hasMoreMap[conversation.conversation.id] ?? true;

    if (isLoadingOlder || !hasMoreMessages || localMessages.length === 0)
      return;

    setLoadingOlderMap((prev) => ({
      ...prev,
      [conversation.conversation.id]: true,
    }));

    try {
      const oldestMessage = localMessages[0];
      const olderMsgs = await getOlderMessages(
        conversation.conversation.id,
        oldestMessage.id,
        20,
      );

      if (!privateKey || !opponentPublicKey) return;

      const sharedKey = await deriveSharedSecret(privateKey, opponentPublicKey);

      const decrypted = await Promise.all(
        olderMsgs.map(async (msg) => {
          try {
            const content = await decryptData(
              base64ToBuffer(msg.content!),
              sharedKey,
              new Uint8Array(base64ToBuffer(msg.iv!)),
            );
            return { ...msg, content: content as string };
          } catch {
            return null;
          }
        }),
      );

      const filtered = decrypted.filter(
        (msg): msg is NonNullable<typeof msg> => msg !== null,
      );

      if (filtered.length === 0) {
        setHasMoreMap((prev) => ({
          ...prev,
          [conversation.conversation.id]: false,
        }));
      } else {
        const scrollContainer = scrollContainerRef.current;
        const scrollHeight = scrollContainer?.scrollHeight;
        const scrollTop = scrollContainer?.scrollTop;

        setLocalMessages((prev) => [...filtered, ...prev]);

        const currentCached = getMessages(conversation.conversation.id) || [];
        const newCachedMessages = [
          ...filtered.map((msg) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            createdAt: new Date(msg.createdAt).toISOString(),
          })),
          ...currentCached,
        ];
        setTimeout(() => {
          setMessages(conversation.conversation.id, newCachedMessages);
        }, 0);

        setTimeout(() => {
          if (scrollContainer && scrollHeight && scrollTop != null) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop =
              scrollTop + (newScrollHeight - scrollHeight);
          }
        }, 0);
      }
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setLoadingOlderMap((prev) => ({
        ...prev,
        [conversation.conversation.id]: false,
      }));
    }
  };

  // =========================
  // 3️⃣ scroll handler
  // =========================
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0) loadOlderMessages();
  };

  // =========================
  // 4️⃣ تحديث آخر رسالة مقروءة
  // =========================
  // ✅ استخدم ref عشان تتابع آخر ID قرأته محلياً بدون ما تعتمد على الـ prop
  const lastReadRef = useRef<string | null>(conversation.lastReadMessageId);

  useEffect(() => {
    if (!localMessages.length) return;

    const lastMessage = localMessages[localMessages.length - 1];

    // تجاهل رسائلك أنت
    if (lastMessage.senderId === currentUserId) return;

    // تجاهل إذا قرأناها مسبقاً (محلياً)
    if (lastReadRef.current === lastMessage.id) return;

    // حدّث الـ ref محلياً فوراً عشان ما يتكرر
    lastReadRef.current = lastMessage.id;

    updateLastReadMessage({
      conversationId: conversation.conversation.id,
      messageId: lastMessage.id,
      userId: currentUserId,
    });
  }, [localMessages]);

  // =========================
  // 5️⃣ realtime
  // =========================
  const { sendMessage } = useChatChannel({
    channelName: CHANNELS.CHAT(conversation.conversation.id),
    privateKey,
    opponentPublicKey: opponentPublicKey!,
    onMessage: (msg) => {
      const safeMsg = {
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        createdAt:
          msg.createdAt && !isNaN(Date.parse(msg.createdAt))
            ? msg.createdAt
            : new Date().toISOString(),
      };
      addMessage(conversation.conversation.id, safeMsg);
      setLocalMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, safeMsg];
      });
    },
    currentUserId,
  });

  // =========================
  // 6️⃣ auto scroll without flash
  // =========================
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || localMessages.length === 0) return;

    // Scroll مباشرة لأدنى نقطة بدون flash
    container.scrollTop = container.scrollHeight;
  }, [localMessages]);

  // =========================
  // 7️⃣ ارسال رسالة
  // =========================
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setText("");

    const newMessage = {
      id: crypto.randomUUID(),
      content: text,
      senderId: currentUserId,
      conversationId: conversation.conversation.id,
      createdAt: new Date().toISOString(),
    };

    addMessage(conversation.conversation.id, newMessage);
    setLocalMessages((prev) => {
      const updated = [...prev, newMessage];
      setTimeout(() => setMessages(conversation.conversation.id, updated), 0);
      return updated;
    });

    await sendMessage(newMessage);
  };

  const currentChatUser = {
    name: resolveConversationTitle(conversation, currentUserId),
    avatarSrc: conversation.conversation.avatar,
  };

  return (
    <>
      {/* Hide header on mobile - it's handled by parent component */}
      <div className="hidden md:flex items-center justify-between border border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {currentChatUser.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{currentChatUser.name}</h2>
          </div>
        </div>
        <HugeiconsIcon
          icon={MoreVertical}
          className="text-muted-foreground h-5 w-5 cursor-pointer"
        />
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto p-6 relative"
      >
        {loadingOlderMap[conversation.conversation.id] && (
          <div className="absolute top-2 left-0 right-0 flex justify-center">
            <div className="bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground">
              Loading older messages...
            </div>
          </div>
        )}

        {localMessages.length > 0 ? (
          localMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg.content || ""}
              name={
                resolveConversationTitle(conversation, currentUserId) ||
                "Unknown"
              }
              isUserMessage={msg.senderId === currentUserId}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 border border-t p-4"
      >
        <HugeiconsIcon
          icon={ImageIcon}
          className="text-muted-foreground h-5 w-5 cursor-pointer"
        />
        <Input
          placeholder="Enter a message..."
          className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-muted h-full"
          value={text}
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
        />
        <Button size="icon" className="rounded-full" type="submit">
          <HugeiconsIcon icon={ArrowRight} />
        </Button>
      </form>
    </>
  );
}
