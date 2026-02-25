"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  User,
  Users,
  LogOut,
  Plus,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { Conversations } from "@/app/actions/chat";
import { resolveConversationTitle } from "@/lib/utilites";
import { hasUnreadMessages } from "@/lib/chat-utils";
import { ChatContact } from "./chat-contact";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function ChatSidebar({
  currentUserId,
  conversations,
  activeConversationId,
  setActiveConversationId,
  onCreateChat,
  onSettings,
}: {
  currentUserId: string;
  conversations: Conversations;
  activeConversationId: string | null;
  setActiveConversationId: (id: string) => void;
  onCreateChat: () => void;
  onSettings: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"personal" | "groups">("personal");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    setIsLoggingOut(false);
    router.push("/");
  };

  // ✅ فلترة حسب النوع
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) =>
      activeTab === "personal"
        ? c.conversation.type === "direct"
        : c.conversation.type === "group",
    );
  }, [conversations, activeTab]);

  return (
    <div className="flex w-full flex-col border border-r h-screen">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Chat</h1>
          <HugeiconsIcon
            icon={Search}
            className="text-muted-foreground h-5 w-5 cursor-pointer"
          />
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg border p-1">
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
      </div>

      {/* Conversations */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-2">
        {filteredConversations.map((c) => {
          const conversation = c.conversation;

          // ✅ استخدام الدالة المحسنة مع دعم الـ cache للتحقق من الرسائل غير المقروءة
          const hasUnread = hasUnreadMessages(c, currentUserId);

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

      {/* Footer with settings, logout and new chat */}
      <div className="p-4 pt-2 space-y-2 border-t bg-background/50">
        <Button
          className="w-full justify-start shadow-sm"
          onClick={onCreateChat}
        >
          <HugeiconsIcon icon={Plus} className="mr-2 h-4 w-4" />
          New chat
        </Button>

        {/* زر الإعدادات الجديد */}
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-muted"
          onClick={onSettings}
        >
          {/* تأكد من استيراد Settings01 من المكتبة */}
          <HugeiconsIcon icon={Settings01Icon} className="mr-2 h-4 w-4" />
          Settings
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <HugeiconsIcon icon={LogOut} className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
