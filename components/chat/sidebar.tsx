"use client";

import { useEffect, useMemo, useState } from "react";
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
import { resolveConversationTitle } from "@/lib/utilites";
import { hasUnreadMessages } from "@/lib/chat-utils";
import { ChatContact } from "./chat-contact";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { ConversationsArray } from "@/app/data/chat/chat-dto";
import { useCryptoStore } from "@/store/useCryptoStore";
import UnlockPrivateKeyModal from "./unlock-private-key";
import { useMessagesStore } from "@/store/useMessagesStore";
import { realtimeClient } from "@/realtime/client";
import { CHANNELS } from "@/realtime/channels";

export function ChatSidebar({
  currentUserId,
  conversations: initialConversations,
}: {
  currentUserId: string;
  conversations: ConversationsArray;
}) {
  const privateKey = useCryptoStore((state) => state.privateKey);
  const [conversations, setConversations] =
    useState<ConversationsArray>(initialConversations);
  const [activeTab, setActiveTab] = useState<"personal" | "groups">("personal");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const path = usePathname();

  // Update conversations when props change
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  // Update read status when navigating to chat
  useEffect(() => {
    if (path.startsWith("/chat/")) {
      const chatId = path.split("/")[2];
      if (chatId) {
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation.id === chatId
              ? {
                  ...c,
                  lastReadMessageId: c.conversation.lastMessageId,
                }
              : c,
          ),
        );
      }
    }
  }, [path]);

  // Subscribe to notifications for real-time unread updates
  useEffect(() => {
    const channel = realtimeClient.channels.get(
      CHANNELS.USER_NOTIFICATIONS(currentUserId),
    );
    const onMessage = (msg: any) => {
      if (msg.name === "notification") {
        const { conversationId, messageId, senderId } = msg.data;
        if (senderId !== currentUserId) {
          setConversations((prev) =>
            prev.map((c) =>
              c.conversation.id === conversationId
                ? {
                    ...c,
                    conversation: {
                      ...c.conversation,
                      lastMessageId: messageId,
                    },
                  }
                : c,
            ),
          );
        }
      }
      if (msg.name === "delete-conversation") {
        setConversations((prev) =>
          prev.filter((c) => c.conversation.id !== msg.data.conversationId),
        );
      }
    };
    channel.subscribe(["notification", "delete-conversation"], onMessage);
    return () => {
      channel.unsubscribe(["notification", "delete-conversation"], onMessage);
    };
  }, [currentUserId]);

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
  const isChatSubPage = path.startsWith("/chat/");

  return (
    <>
      {privateKey === null ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <UnlockPrivateKeyModal open={true} onOpenChange={() => {}} />
        </div>
      ) : (
        <div
          className={cn(
            "overflow-hidden transition-all duration-0",
            isChatSubPage ? "hidden md:flex md:w-70 lg:w-80" : "md:w-80 w-full",
          )}
        >
          <div
            className={
              path === "/chat/new" || path === "/chat/settings"
                ? "md:flex w-full flex-col border border-r h-screen hidden"
                : "flex flex-col border border-r h-screen w-full"
            }
          >
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
                const isCurrent = conversation.id === path.split("/")[2];
                const hasUnread = hasUnreadMessages(
                  c,
                  currentUserId,
                  isCurrent,
                );

                return (
                  <ChatContact
                    key={conversation.id}
                    id={conversation.id}
                    name={
                      resolveConversationTitle(c, currentUserId) || "Unknown"
                    }
                    avatar={conversation.avatar}
                    timestamp={conversation.updatedAt}
                    hasUnread={hasUnread}
                    isActive={isCurrent}
                    conversation={c}
                    currentUserId={currentUserId}
                    onClick={() => router.push(`/chat/${conversation.id}`)}
                  />
                );
              })}
            </div>

            {/* Footer with settings, logout and new chat */}
            <div className="p-4 pt-2 space-y-2 border-t bg-background/50">
              <Button
                className="w-full justify-start shadow-sm"
                onClick={() => router.push("/chat/new")}
              >
                <HugeiconsIcon icon={Plus} className="mr-2 h-4 w-4" />
                New chat
              </Button>

              {/* زر الإعدادات الجديد */}
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-muted"
                onClick={() => router.push("/chat/settings")}
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
        </div>
      )}
    </>
  );
}
