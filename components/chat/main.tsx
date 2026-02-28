"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  MoreVertical,
  Delete01Icon,
  Edit01Icon,
  Cancel01Icon,
  Tick01Icon,
  CheckmarkCircle02Icon,
  ArrowDown01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import {
  ConversationParticipantEntry,
  getMessagesAction,
  updateReadStatusAction,
  deleteConversationAction,
  editMessageAction,
  deleteMessagesAction,
} from "@/app/actions/chat";
import { resolveConversationTitle } from "@/lib/utilites";
import { useChatChannel } from "@/realtime/use-channel";
import { CHANNELS } from "@/realtime/channels";
import { deriveSharedSecret } from "@/lib/crypto/exchange";
import { decryptData } from "@/lib/crypto/decrypt";
import { encryptData } from "@/lib/crypto/encrypt";
import { base64ToBuffer, bufferToBase64 } from "@/lib/crypto/encoding";
import { useMessagesStore } from "@/store/useMessagesStore";
import { LocalMessage } from "@/app/data/chat/chat-dto";
import { useCryptoStore } from "@/store/useCryptoStore";
import { useRouter } from "next/navigation";
import { Textarea } from "../ui/textarea";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// MessageBubble
// ─────────────────────────────────────────────
interface MessageBubbleProps {
  message: LocalMessage;
  isUserMessage: boolean;
  name: string;
  // Selection mode
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  // Dropdown actions
  onDeleteClick: (id: string) => void;
  onEditClick: (msg: LocalMessage) => void;
  // Long press (mobile)
  onLongPress: (id: string) => void;
}

const MessageBubble = ({
  message,
  isUserMessage,
  name,
  selectionMode,
  isSelected,
  onSelect,
  onDeleteClick,
  onEditClick,
  onLongPress,
}: MessageBubbleProps) => {
  const [hovered, setHovered] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      onLongPress(message.id);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleBubbleClick = () => {
    if (selectionMode) onSelect(message.id);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2 group transition-colors duration-150 rounded-lg px-1",
        isUserMessage ? "justify-end" : "justify-start",
        selectionMode && isSelected ? "dark:bg-muted/10 bg-muted/50 py-2" : "",
        selectionMode ? "cursor-pointer" : "",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleBubbleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      {/* Checkbox (selection mode) */}
      {selectionMode && (
        <div
          className={cn(
            "flex items-center self-center shrink-0",
            isUserMessage ? "order-last ml-2" : "order-first mr-2",
          )}
        >
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              isSelected
                ? "bg-primary border-primary"
                : "border-muted-foreground",
            )}
          >
            {isSelected && (
              <HugeiconsIcon icon={Tick01Icon} className="w-3 h-3 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Avatar (opponent only) */}
      {!isUserMessage && !selectionMode && (
        <Avatar className="h-8 w-8 shrink-0 self-end">
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      {!isUserMessage && selectionMode && (
        <Avatar className="h-8 w-8 shrink-0 self-end opacity-60">
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}

      {/* Bubble + dropdown arrow */}
      <div
        className={cn(
          "flex items-end gap-1",
          isUserMessage ? "flex-row-reverse" : "flex-row",
        )}
      >
        {/* Dropdown arrow — desktop hover, only for own messages */}
        {isUserMessage && !selectionMode && (
          <div
            className={cn(
              "self-center transition-opacity duration-150 shrink-0",
              hovered ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-muted"
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              >
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className="h-3.5 w-3.5 text-muted-foreground"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isUserMessage ? "end" : "start"}
                className="min-w-[120px]"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(message);
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <HugeiconsIcon icon={Edit01Icon} className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(message.id);
                  }}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Bubble itself */}
        <div
          className={cn(
            "w-full rounded-2xl px-4 py-2.5",
            isUserMessage
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm",
          )}
        >
          {message.deletedAt ? (
            <p
              className={`text-sm italic ${isUserMessage ? "text-white/70" : "text-muted-foreground"}`}
            >
              message deleted
            </p>
          ) : (
            <>
              <p className="text-sm ">{message.content}</p>
              {message.editedAt && (
                <p
                  className={cn(
                    "text-[10px] mt-0.5",
                    isUserMessage
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground",
                  )}
                >
                  edited
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ChatMain
// ─────────────────────────────────────────────
interface ChatMainProps {
  currentUserId: string;
  conversation: ConversationParticipantEntry;
}

export function ChatMain({ currentUserId, conversation }: ChatMainProps) {
  const privateKey = useCryptoStore((state) => state.privateKey);
  const router = useRouter();

  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [text, setText] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [loadingOlderMap, setLoadingOlderMap] = useState<
    Record<string, boolean>
  >({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});

  // ── Selection state ──
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Edit state ──
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // ── remove conversation ──
  const [removeConversationOpen, setRemoveConversationOpen] = useState(false);

  const {
    setMessages,
    getMessages,
    addMessage,
    updateMessage,
    deleteConversation: deleteConversationStore,
  } = useMessagesStore();

  const opponent = conversation.conversation.participants.find(
    (p) => p.userId !== currentUserId,
  );
  const opponentPublicKey = opponent?.user.publicKey;

  // =========================
  // Helper: sharedKey
  // =========================
  const getSharedKey = useCallback(async () => {
    if (!privateKey || !opponentPublicKey) throw new Error("Missing keys");
    return await deriveSharedSecret(privateKey, opponentPublicKey);
  }, [privateKey, opponentPublicKey]);

  // =========================
  // 1️⃣ Load messages
  // =========================
  useEffect(() => {
    let mounted = true;
    async function loadMessages() {
      const msgs = await getMessagesAction(conversation.conversation.id);
      if (!privateKey || !opponentPublicKey) return;
      const sharedKey = await getSharedKey();

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
        (m): m is NonNullable<typeof m> => m !== null,
      );

      if (mounted) {
        setLocalMessages(filtered as LocalMessage[]);
        setTimeout(
          () => setMessages(conversation.conversation.id, filtered),
          0,
        );
        setHasMoreMap((prev) => ({
          ...prev,
          [conversation.conversation.id]: filtered.length === 15,
        }));
      }
    }
    loadMessages();
    return () => {
      mounted = false;
    };
  }, [conversation.conversation.id, privateKey, opponentPublicKey]);

  // =========================
  // 2️⃣ Load older messages
  // =========================
  const loadOlderMessages = async () => {
    const isLoading = loadingOlderMap[conversation.conversation.id] || false;
    const hasMore = hasMoreMap[conversation.conversation.id] ?? true;
    if (isLoading || !hasMore || localMessages.length === 0) return;

    setLoadingOlderMap((prev) => ({
      ...prev,
      [conversation.conversation.id]: true,
    }));
    try {
      const oldest = localMessages[0];
      const olderMsgs = await getMessagesAction(
        conversation.conversation.id,
        oldest.id,
      );
      if (!privateKey || !opponentPublicKey) return;
      const sharedKey = await getSharedKey();

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
        (m): m is NonNullable<typeof m> => m !== null,
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

        setLocalMessages((prev) => [...(filtered as LocalMessage[]), ...prev]);

        const currentCached = getMessages(conversation.conversation.id) || [];
        const newCached = [...filtered, ...currentCached];
        setTimeout(
          () => setMessages(conversation.conversation.id, newCached),
          0,
        );
        setTimeout(() => {
          if (scrollContainer && scrollHeight && scrollTop != null) {
            scrollContainer.scrollTop =
              scrollTop + (scrollContainer.scrollHeight - scrollHeight);
          }
        }, 0);
      }
    } catch (err) {
      console.error("Error loading older messages:", err);
    } finally {
      setLoadingOlderMap((prev) => ({
        ...prev,
        [conversation.conversation.id]: false,
      }));
    }
  };

  // =========================
  // 3️⃣ Scroll handler
  // =========================
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) loadOlderMessages();
  };

  // =========================
  // 4️⃣ Mark as read
  // =========================
  const lastReadRef = useRef<string | null>(conversation.lastReadMessageId);
  useEffect(() => {
    if (!localMessages.length) return;
    const last = localMessages[localMessages.length - 1];
    if (last.senderId === currentUserId) return;
    if (lastReadRef.current === last.id) return;
    // Only mark as read if the document is focused (tab is active)
    if (!document.hasFocus()) return;
    lastReadRef.current = last.id;
    updateReadStatusAction(conversation.conversation.id, last.id);
  }, [localMessages]);

  // =========================
  // 5️⃣ Realtime
  // =========================
  const opponentUserIds = conversation.conversation.participants
    .filter((p) => p.userId !== currentUserId)
    .map((p) => p.userId);

  const {
    sendMessage,
    editMessage,
    deleteMessage,
    publish,
    deleteConversation,
  } = useChatChannel({
    channelName: CHANNELS.CHAT(conversation.conversation.id),
    privateKey,
    opponentPublicKey: opponentPublicKey!,
    onMessage: (msg) => {
      if (msg.type === "send") {
        const safeMsg: LocalMessage = {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          createdAt:
            msg.createdAt && !isNaN(Date.parse(msg.createdAt))
              ? msg.createdAt
              : new Date().toISOString(),
          ...msg,
        };
        addMessage(conversation.conversation.id, safeMsg);
        setLocalMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, safeMsg];
        });
      } else if (msg.type === "edit") {
        // Update cache
        updateMessage(conversation.conversation.id, msg.id, {
          content: msg.content,
          editedAt: msg.editedAt,
        });

        // Update local state
        setLocalMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? { ...m, content: msg.content, editedAt: msg.editedAt }
              : m,
          ),
        );

        return;
      } else if (msg.type === "delete") {
        const messageIds = msg.data as string[];
        // Update cache
        for (const id of messageIds) {
          updateMessage(conversation.conversation.id, id, {
            deletedAt: new Date(),
          });
        }
        // Update local state
        setLocalMessages((prev) =>
          prev.map((m) =>
            messageIds.includes(m.id) ? { ...m, deletedAt: new Date() } : m,
          ),
        );
        return;
      } else if (msg.name === "conversation:delete") {
        deleteConversationStore(conversation.conversation.id);
        router.push("/chat");
        return;
      }
    },
    currentUserId,
    opponentUserIds,
  });

  // =========================
  // 6️⃣ Auto scroll
  // =========================
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || localMessages.length === 0) return;
    container.scrollTop = container.scrollHeight;
  }, [localMessages]);

  // =========================
  // 7️⃣ Send message
  // =========================
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setText("");

    const newMessage: LocalMessage = {
      id: crypto.randomUUID(),
      content: text,
      senderId: currentUserId,
      conversationId: conversation.conversation.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "text",
      iv: null,
      replyToMessageId: null,
      editedAt: null,
      deletedAt: null,
    };

    addMessage(conversation.conversation.id, newMessage);
    setLocalMessages((prev) => {
      const updated = [...prev, newMessage];
      setTimeout(() => setMessages(conversation.conversation.id, updated), 0);
      return updated;
    });
    await sendMessage(newMessage);
  };

  // =========================
  // 8️⃣ Selection logic
  // =========================
  const enterSelectionMode = (messageId: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([messageId]));
    // Cancel edit if active
    setEditingMessageId(null);
    setEditText("");
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // =========================
  // 9️⃣ Delete logic
  // =========================

  // Called from dropdown → enters selection mode with this message selected
  const handleDropdownDelete = (messageId: string) => {
    enterSelectionMode(messageId);
  };

  // Called from selection toolbar → delete all selected
  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    // Optimistic update
    const now = new Date();

    setLocalMessages((prev) =>
      prev.map((m) => (selectedIds.has(m.id) ? { ...m, deletedAt: now } : m)),
    );
    const cached = getMessages(conversation.conversation.id) || [];
    setMessages(
      conversation.conversation.id,
      cached.map((m) => (selectedIds.has(m.id) ? { ...m, deletedAt: now } : m)),
    );

    exitSelectionMode();
    await deleteMessage(ids);
  };

  // =========================
  // 🔟 Edit logic
  // =========================
  const handleEditClick = (msg: LocalMessage) => {
    setEditingMessageId(msg.id);
    setEditText(msg.content || "");
    setEditDialogOpen(true);
    // Exit selection if active
    exitSelectionMode();
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditText("");
    setEditDialogOpen(false);
  };

  const handleEditSubmit = async () => {
    if (!editText.trim() || !editingMessageId) return;

    const messageId = editingMessageId;
    const newContent = editText.trim();

    // Optimistic update
    setLocalMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, content: newContent, editedAt: new Date() }
          : m,
      ),
    );
    const cached = getMessages(conversation.conversation.id) || [];
    setMessages(
      conversation.conversation.id,
      cached.map((m) =>
        m.id === messageId
          ? { ...m, content: newContent, editedAt: new Date() }
          : m,
      ),
    );

    setEditingMessageId(null);
    setEditText("");

    // Encrypt then save
    try {
      await editMessage({
        id: messageId,
        content: newContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "text",
        senderId: currentUserId,
        conversationId: conversation.conversation.id,
        editedAt: new Date(),
        iv: null,
        replyToMessageId: null,
        deletedAt: null,
      });
    } catch (err) {
      console.error("Edit failed:", err);
    }
    setEditDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    await deleteConversation(conversation.conversation.id);
  };

  const currentChatUser = {
    name: resolveConversationTitle(conversation, currentUserId),
    avatarSrc: conversation.conversation.avatar,
  };

  const opponentName =
    resolveConversationTitle(conversation, currentUserId) || "Unknown";

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b p-4 shrink-0">
        {selectionMode ? (
          /* Selection mode header */
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={exitSelectionMode}>
                <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
              </Button>
              <span className="font-semibold text-sm">
                {selectedIds.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Select all (own messages only) */}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  const ownIds = localMessages
                    .filter((m) => m.senderId === currentUserId)
                    .map((m) => m.id);
                  setSelectedIds(new Set(ownIds));
                }}
              >
                Select all
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 h-8"
                disabled={selectedIds.size === 0}
                onClick={handleDeleteSelected}
              >
                <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                Delete ({selectedIds.size})
              </Button>
            </div>
          </div>
        ) : (
          /* Normal header */
          <>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/chat")}
                className="shrink-0 md:hidden"
              >
                <HugeiconsIcon icon={ArrowLeft} className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {currentChatUser.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="font-semibold truncate max-w-[160px] sm:max-w-[250px]">
                  {currentChatUser.name}
                </h2>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" />}
              >
                <HugeiconsIcon icon={MoreVertical} />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => setRemoveConversationOpen(true)}
                >
                  Remove conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* ── Alert Dialog for Delete ── */}
      <AlertDialog
        open={removeConversationOpen}
        onOpenChange={setRemoveConversationOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this conversation? This action
              cannot be undone and will remove it for all participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Messages ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-1 overflow-y-scroll p-4 relative"
      >
        {hasMoreMap[conversation.conversation.id] && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadOlderMessages}
              disabled={loadingOlderMap[conversation.conversation.id]}
            >
              {loadingOlderMap[conversation.conversation.id]
                ? "Loading..."
                : "Load Older Messages"}
            </Button>
          </div>
        )}

        {localMessages.length > 0 ? (
          localMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              name={opponentName}
              isUserMessage={msg.senderId === currentUserId}
              // Selection
              selectionMode={selectionMode}
              isSelected={selectedIds.has(msg.id)}
              onSelect={(id) => {
                // Only allow selecting own messages
                if (msg.senderId === currentUserId) toggleSelect(id);
              }}
              // Dropdown
              onDeleteClick={handleDropdownDelete}
              onEditClick={handleEditClick}
              // Long press (mobile → selection mode)
              onLongPress={(id) => {
                if (msg.senderId === currentUserId) enterSelectionMode(id);
              }}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">No messages yet</p>
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 border-t p-4 shrink-0"
      >
        <HugeiconsIcon
          icon={ImageIcon}
          className="text-muted-foreground h-5 w-5 cursor-pointer shrink-0"
        />
        <Input
          placeholder={
            selectionMode
              ? "Exit selection to send messages..."
              : "Enter a message..."
          }
          className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-muted h-10"
          value={text}
          autoComplete="off"
          disabled={selectionMode}
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          size="icon"
          className="rounded-full shrink-0"
          type="submit"
          disabled={selectionMode || !text.trim()}
        >
          <HugeiconsIcon icon={ArrowRight} />
        </Button>
      </form>

      {/* ── Edit Dialog ── */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            handleEditCancel();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Edit your message..."
            className="min-h-[100px] resize-none"
          />
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" onClick={handleEditCancel} />}
            >
              Cancel
            </DialogClose>
            <Button onClick={handleEditSubmit} disabled={!editText.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
