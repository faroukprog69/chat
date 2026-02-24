"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, User, Users } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { Conversations, getMessagesByConversationId } from "@/app/actions/chat";
import { resolveConversationTitle } from "@/lib/utilites";
import { hasUnreadMessagesOptimized } from "@/lib/chat-utils";
import { ChatContact } from "./chat-contact";
import { useMessagesStore } from "@/store/useMessagesStore";

export function ChatSidebar({
  currentUserId,
  conversations,
  activeConversationId,
  setActiveConversationId,
  onCreateChat,
}: {
  currentUserId: string;
  conversations: Conversations;
  activeConversationId: string | null;
  setActiveConversationId: (id: string) => void;
  onCreateChat: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"personal" | "groups">("personal");
  const { getMessages } = useMessagesStore();

  // ✅ فلترة حسب النوع
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) =>
      activeTab === "personal"
        ? c.conversation.type === "direct"
        : c.conversation.type === "group",
    );
  }, [conversations, activeTab]);

  return (
    <div className="flex w-80 flex-col border border-r p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat</h1>
        <HugeiconsIcon
          icon={Search}
          className="text-muted-foreground h-5 w-5 cursor-pointer"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex rounded-lg border p-1">
        <Button
          variant="ghost"
          className={cn(
            "h-9 flex-1 rounded-md text-sm font-medium",
            activeTab === "personal"
              ? "shadow-sm"
              : "text-muted-foreground hover:bg-transparent",
          )}
          onClick={() => setActiveTab("personal")}
        >
          <HugeiconsIcon icon={User} className="mr-2 h-4 w-4" />
          Personal
        </Button>

        <Button
          variant="ghost"
          disabled={true}
          className={cn(
            "h-9 flex-1 rounded-md text-sm font-medium",
            activeTab === "groups"
              ? "shadow-sm"
              : "text-muted-foreground hover:bg-transparent",
          )}
          onClick={() => setActiveTab("groups")}
        >
          <HugeiconsIcon icon={Users} className="mr-2 h-4 w-4" />
          Groups
        </Button>
      </div>

      {/* Conversations */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {filteredConversations.map((c) => {
          const conversation = c.conversation;

          // ✅ استخدام الدالة المحسنة مع دعم الـ cache للتحقق من الرسائل غير المقروءة
          const hasUnread = hasUnreadMessagesOptimized(c, currentUserId);

          return (
            <ChatContact
              key={conversation.id}
              id={conversation.id}
              name={resolveConversationTitle(c, currentUserId) || "Unknown"}
              avatar={conversation.avatar}
              timestamp={conversation.updatedAt}
              hasUnread={hasUnread}
              isActive={conversation.id === activeConversationId}
              conversation={c}
              currentUserId={currentUserId}
              onClick={setActiveConversationId}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6">
        <Button className="w-full" onClick={onCreateChat}>
          New chat
        </Button>
      </div>
    </div>
  );
}
