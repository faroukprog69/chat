"use client";

import { useEffect, useState } from "react";
import { getMessage } from "@/app/actions/chat";
import { useCryptoStore } from "@/store/useCryptoStore";
import { deriveSharedSecret } from "@/lib/crypto/exchange";
import { decryptData } from "@/lib/crypto/decrypt";
import { base64ToBuffer } from "@/lib/crypto/encoding";
import { ConversationParticipantEntry } from "@/app/actions/chat";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const opponent = conversation.conversation.participants.find(
    (p) => p.userId !== currentUserId,
  );

  const opponentPublicKey = opponent?.user.publicKey;

  useEffect(() => {
    async function loadLastMessage() {
      if (
        !conversation.conversation.lastMessageId ||
        !privateKey ||
        !opponentPublicKey
      )
        return;

      const msg = await getMessage({
        messageId: conversation.conversation.lastMessageId,
      });

      if (!msg) return;

      const sharedKey = await deriveSharedSecret(privateKey, opponentPublicKey);

      const decrypted = await decryptData(
        base64ToBuffer(msg.content!),
        sharedKey,
        new Uint8Array(base64ToBuffer(msg.iv!)),
      );

      if (decrypted) {
        setLastMessage(decrypted);
      }
    }

    loadLastMessage();
  }, [conversation.conversation.lastMessageId, privateKey, opponentPublicKey]);
  const formattedTime = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);

  return (
    <div
      className={cn(
        "hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors",
        isActive && "bg-muted",
      )}
      onClick={() => onClick(id)}
    >
      <Avatar>
        <AvatarImage src={avatar ?? ""} alt={name} />
        <AvatarFallback>{name?.charAt(0) ?? "?"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="truncate font-medium">{name || "Untitled"}</span>
          <span className="text-muted-foreground text-xs">{formattedTime}</span>
        </div>

        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <p className="truncate">{lastMessage}</p>
          {hasUnread && (
            <div className="ml-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
      </div>
    </div>
  );
}
