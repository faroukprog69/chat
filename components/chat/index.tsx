"use client";

import { Conversations } from "@/app/actions/chat";
import { ChatMain } from "@/components/chat/main";
import { ChatSidebar } from "@/components/chat/sidebar";
import { useState } from "react";
import { CreateChatForm } from "./create";
import { RealtimeChannel } from "@/components/providers/channel-provider";
import { CHANNELS } from "@/realtime/channels";
import { RealtimeProvider } from "@/components/providers/ably-provider";
import { useCryptoStore } from "@/store/useCryptoStore";
import UnlockPrivateKeyModal from "./unlock-private-key";
import { ArrowLeft } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";

type ChatView =
  | { type: "idle" }
  | { type: "chat"; conversationId: string }
  | { type: "create" };

export default function Chat({
  conversations,
  userId,
}: {
  conversations: Conversations;
  userId: string;
}) {
  const [view, setView] = useState<ChatView>({ type: "idle" });
  const privateKey = useCryptoStore((state) => state.privateKey);

  return (
    <div className="flex h-screen">
      {/* Desktop: Always show sidebar | Mobile: Show only when idle */}
      <div className="hidden md:flex">
        <ChatSidebar
          currentUserId={userId}
          conversations={conversations}
          activeConversationId={
            view.type === "chat" ? view.conversationId : null
          }
          setActiveConversationId={(id) =>
            setView({ type: "chat", conversationId: id })
          }
          onCreateChat={() => setView({ type: "create" })}
        />
      </div>

      {/* Mobile: Show sidebar only when idle */}
      <div className="md:hidden">
        {view.type === "idle" && (
          <ChatSidebar
            currentUserId={userId}
            conversations={conversations}
            activeConversationId={null}
            setActiveConversationId={(id) =>
              setView({ type: "chat", conversationId: id })
            }
            onCreateChat={() => setView({ type: "create" })}
          />
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {!privateKey ? (
          <div className="m-4 flex flex-1 flex-col rounded-lg">
            <UnlockPrivateKeyModal open={true} onOpenChange={() => {}} />
          </div>
        ) : (
          <>
            {/* Mobile: Show chat view with back button */}
            <div className="md:hidden max-h-screen">
              {view.type === "chat" && (
                <div className="flex flex-col h-full">
                  {/* Header with back button */}
                  <div className="flex items-center gap-3 p-4 border-b">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setView({ type: "idle" })}
                      className="shrink-0"
                    >
                      <HugeiconsIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                      <h2 className="font-semibold truncate">
                        {(() => {
                          const conversation = conversations.find(
                            (c) => c.conversation.id === view.conversationId,
                          );
                          return conversation?.conversation.title || "Chat";
                        })()}
                      </h2>
                    </div>
                  </div>

                  {/* Chat content */}
                  <div className="flex-1">
                    {(() => {
                      const conversation = conversations.find(
                        (c) => c.conversation.id === view.conversationId,
                      );

                      return conversation ? (
                        <RealtimeProvider>
                          <RealtimeChannel
                            channelName={CHANNELS.CHAT(
                              conversation.conversation.id,
                            )}
                          >
                            <ChatMain
                              conversation={conversation}
                              currentUserId={userId}
                              privateKey={privateKey}
                            />
                          </RealtimeChannel>
                        </RealtimeProvider>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <p className="text-muted-foreground">
                            Conversation not found
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {view.type === "create" && (
                <div className="flex flex-col h-full">
                  {/* Header with back button */}
                  <div className="flex items-center gap-3 p-4 border-b">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setView({ type: "idle" })}
                      className="shrink-0"
                    >
                      <HugeiconsIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Button>
                    <h2 className="font-semibold">New Chat</h2>
                  </div>

                  {/* Create chat form */}
                  <div className="flex-1 p-4">
                    <CreateChatForm
                      onSuccess={(conversationId) =>
                        setView({ type: "chat", conversationId })
                      }
                      userId={userId}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: Show chat view normally */}
            <div className="hidden md:flex m-4 flex-1 flex-col rounded-lg">
              {view.type === "chat" &&
                (() => {
                  const conversation = conversations.find(
                    (c) => c.conversation.id === view.conversationId,
                  );

                  return conversation ? (
                    <RealtimeProvider>
                      <RealtimeChannel
                        channelName={CHANNELS.CHAT(
                          conversation.conversation.id,
                        )}
                      >
                        <ChatMain
                          conversation={conversation}
                          currentUserId={userId}
                          privateKey={privateKey}
                        />
                      </RealtimeChannel>
                    </RealtimeProvider>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <p className="text-muted-foreground">
                        Conversation not found
                      </p>
                    </div>
                  );
                })()}

              {view.type === "create" && (
                <CreateChatForm
                  onSuccess={(conversationId) =>
                    setView({ type: "chat", conversationId })
                  }
                  userId={userId}
                />
              )}

              {view.type === "idle" && (
                <div className="flex h-full w-full items-center justify-center">
                  <p className="text-muted-foreground">
                    Select a conversation to start chatting
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
