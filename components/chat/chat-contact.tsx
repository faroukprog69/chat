"use client";

import { useEffect, useState } from "react";
// نستخدم getMessage (الأكشن الأصلي عندك)
import { getMessageAction } from "@/app/actions/chat";
import { useCryptoStore } from "@/store/useCryptoStore";
import { deriveSharedSecret } from "@/lib/crypto/exchange";
import { decryptData } from "@/lib/crypto/decrypt";
import { base64ToBuffer } from "@/lib/crypto/encoding";
import { ConversationParticipantEntry } from "@/app/actions/chat";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessagesStore } from "@/store/useMessagesStore";

interface ChatContactProps {
  id: string;
  name: string;
  avatar?: string | null;
  timestamp: Date;
  hasUnread: boolean;
  isActive: boolean;
  conversation: ConversationParticipantEntry;
  currentUserId: string;
  onClick: (id: string) => void;
}

export function ChatContact({
  id,
  name,
  avatar,
  timestamp,
  hasUnread,
  isActive,
  onClick,
  conversation,
  currentUserId,
}: ChatContactProps) {
  const privateKey = useCryptoStore((s) => s.privateKey);
  const [lastMessage, setLastMessage] = useState<string>("");
  const messages = useMessagesStore((state) => state.cache[id]);
  useEffect(() => {
    if (messages) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        setLastMessage(
          lastMessage.deletedAt ? "message deleted" : lastMessage.content || "",
        );
      }
    }
  }, [messages]);
  // منطق تحديد الطرف الآخر للحصول على مفتاحه العام (نفس منطقك القديم)
  const opponent = conversation.conversation.participants.find(
    (p) => p.userId !== currentUserId,
  );
  const opponentPublicKey = opponent?.user.publicKey;

  useEffect(() => {
    let isMounted = true; // لمنع تحديث الحالة إذا تم إلغاء المكون

    async function loadLastMessage() {
      // 1. التحقق من وجود البيانات (نفس شروطك)
      if (
        !conversation.conversation.lastMessageId ||
        !privateKey ||
        !opponentPublicKey
      )
        return;

      try {
        // 2. جلب الرسالة
        const msg = await getMessageAction(
          conversation.conversation.lastMessageId,
        );
        console.log("Last message:", msg);
        if (!msg || !isMounted) return;

        // 3. فك التشفير (نفس المنطق الذي يعمل عندك)
        const sharedKey = await deriveSharedSecret(
          privateKey,
          opponentPublicKey,
        );

        const decrypted = await decryptData(
          base64ToBuffer(msg.content!),
          sharedKey,
          new Uint8Array(base64ToBuffer(msg.iv!)),
        );

        if (decrypted && isMounted && !msg.deletedAt) {
          setLastMessage(decrypted as string);
        } else {
          setLastMessage("message deleted");
        }
      } catch (error) {
        console.error("Decryption error:", error);
      }
    }

    loadLastMessage();

    return () => {
      isMounted = false;
    };
  }, [conversation.conversation.lastMessageId, privateKey, opponentPublicKey]);

  // تنسيق الوقت
  const formattedTime = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);

  return (
    <div
      className={cn(
        "hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all",
        isActive && "bg-muted shadow-sm",
      )}
      onClick={() => onClick(id)}
    >
      {/* Avatar بتصميم مطور */}
      <Avatar className="h-12 w-12 border">
        <AvatarImage src={avatar ?? ""} alt={name} />
        <AvatarFallback>{name?.charAt(0) ?? "?"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={cn(
              "truncate font-medium text-[15px]",
              hasUnread ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {name || "Untitled"}
          </span>
          <span className="text-muted-foreground text-[11px] font-light">
            {formattedTime}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p
            className={cn(
              "truncate text-sm max-w-[180px]",
              hasUnread
                ? "text-foreground font-semibold"
                : "text-muted-foreground/70",
            )}
          >
            {/* عرض الرسالة المفكوكة أو رسالة انتظار */}
            {lastMessage || ""}
          </p>

          {/* علامة الرسائل غير المقروءة */}
          {hasUnread && (
            <div className="ml-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          )}
        </div>
      </div>
    </div>
  );
}
