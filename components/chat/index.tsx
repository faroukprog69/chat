"use client";

import { useState } from "react";
import { ChatMain } from "@/components/chat/main";
import { ChatSidebar } from "@/components/chat/sidebar";
import { CreateChatForm } from "./create";
import { RealtimeChannel } from "@/components/providers/channel-provider";
import { CHANNELS } from "@/realtime/channels";
import { RealtimeProvider } from "@/components/providers/ably-provider";
import { useCryptoStore } from "@/store/useCryptoStore";
import UnlockPrivateKeyModal from "./unlock-private-key";
import { ArrowLeft } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Conversations } from "@/app/actions/chat";
import { resolveConversationTitle } from "@/lib/utilites";
import { cn } from "@/lib/utils";
import SettingsPage from "../settings";

export type ChatView =
  | { type: "idle" }
  | { type: "chat"; conversationId: string }
  | { type: "create" }
  | { type: "settings" };

export default function Chat({
  conversations,
  user,
}: {
  conversations: Conversations;
  user: {
    id: string;
    name: string;
    displayName: string | null;
  };
}) {
  const [view, setView] = useState<ChatView>({ type: "idle" });
  const privateKey = useCryptoStore((state) => state.privateKey);

  const isIdle = view.type === "idle";

  const activeConversation =
    view.type === "chat"
      ? conversations.find((c) => c.conversation.id === view.conversationId)
      : null;

  const mobileTitle =
    view.type === "create"
      ? "New Chat"
      : activeConversation
        ? resolveConversationTitle(activeConversation, user.id) || "Chat"
        : "";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ===== SIDEBAR ===== */}
      <div
        className={cn(
          "shrink-0 overflow-hidden transition-all duration-0",
          "md:w-80", // desktop: دايماً مفتوح
          isIdle ? "w-full" : "w-0", // mobile: كامل عند idle، مغلق غيره
        )}
      >
        <ChatSidebar
          currentUserId={user.id}
          conversations={conversations}
          activeConversationId={
            view.type === "chat" ? view.conversationId : null
          }
          setActiveConversationId={(id) =>
            setView({ type: "chat", conversationId: id })
          }
          onCreateChat={() => setView({ type: "create" })}
          onSettings={() => setView({ type: "settings" })}
        />
      </div>

      {/* ===== MAIN AREA ===== */}
      <div
        className={cn(
          "flex flex-col overflow-hidden transition-all duration-0",
          "md:flex-1", // desktop: يأخذ الباقي دايماً
          isIdle ? "w-0" : "flex-1", // mobile: مخفي عند idle، كامل غيره
        )}
      >
        {!privateKey ? (
          <div className="flex flex-1 items-center justify-center p-4">
            <UnlockPrivateKeyModal open={true} onOpenChange={() => {}} />
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="flex flex-1 flex-col max-h-[100dvh]">
              {view.type === "chat" &&
                (activeConversation ? (
                  <RealtimeProvider>
                    <RealtimeChannel
                      channelName={CHANNELS.CHAT(
                        activeConversation.conversation.id,
                      )}
                    >
                      <ChatMain
                        conversation={activeConversation}
                        currentUserId={user.id}
                        privateKey={privateKey}
                        setView={setView}
                      />
                    </RealtimeChannel>
                  </RealtimeProvider>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      Conversation not found
                    </p>
                  </div>
                ))}

              {view.type === "create" && (
                <CreateChatForm
                  onSuccess={(conversationId) =>
                    setView({ type: "chat", conversationId })
                  }
                  onBack={() => setView({ type: "idle" })}
                  userId={user.id}
                />
              )}

              {view.type === "idle" && (
                <div className="hidden md:flex h-full items-center justify-center">
                  <p className="text-muted-foreground">
                    Select a conversation to start chatting
                  </p>
                </div>
              )}
              {view.type === "settings" && (
                <div className="flex h-full flex-col overflow-y-scroll">
                  <SettingsPage
                    name={user.name}
                    displayName={user.displayName || ""}
                    onBack={() => setView({ type: "idle" })}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
