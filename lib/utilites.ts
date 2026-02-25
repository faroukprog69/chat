import { ConversationParticipantEntry } from "@/app/actions/chat";

export function resolveConversationTitle(
  conversation: ConversationParticipantEntry,
  currentUserId: string,
) {
  if (conversation.conversation.type === "group") {
    return conversation.conversation.title;
  }

  const other = conversation.conversation.participants.find(
    (p) => p.userId !== currentUserId,
  );

  return other?.user?.displayName ?? "Unknown";
}
