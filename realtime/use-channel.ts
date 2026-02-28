"use client";

import { useChannel } from "ably/react";
import type { Message } from "ably";
import { deriveSharedSecret } from "@/lib/crypto/exchange";
import { decryptData } from "@/lib/crypto/decrypt";
import { base64ToBuffer, bufferToBase64 } from "@/lib/crypto/encoding";
import { encryptData } from "@/lib/crypto/encrypt";
import {
  deleteConversationAction,
  deleteMessagesAction,
  editMessageAction,
  sendMessageAction,
} from "@/app/actions/chat";
import { LocalMessage } from "@/app/data/chat/chat-dto";
import { realtimeClient } from "./client";
import { CHANNELS } from "./channels";

export function useChatChannel({
  channelName,
  privateKey,
  opponentPublicKey,
  currentUserId,
  opponentUserIds,
  onMessage,
}: {
  channelName: string;
  privateKey: CryptoKey | null;
  opponentPublicKey: string;
  currentUserId: string;
  opponentUserIds: string[];
  onMessage?: (msg: any) => void;
}) {
  const { publish } = useChannel(channelName, async (msg: Message) => {
    try {
      if (!privateKey) return;
      if (msg.name === "message:delete") {
        onMessage?.({
          data: msg.data,
          type: "delete",
        });
        return;
      }
      if (msg.name === "conversation:delete") {
        onMessage?.({
          name: msg.name,
          data: msg.data,
        });
        return;
      }
      const sharedKey = await deriveSharedSecret(privateKey, opponentPublicKey);

      const decryptedContent = await decryptData(
        base64ToBuffer(msg.data.ciphertext),
        sharedKey,
        new Uint8Array(base64ToBuffer(msg.data.iv)),
      );

      // لا تحدث lastRead فقط
      if (msg.name === "message") {
        onMessage?.({
          ...msg.data,
          content: decryptedContent,
          type: "send",
        });
      }

      if (msg.name === "message:edit") {
        onMessage?.({
          ...msg.data,
          content: decryptedContent,
          type: "edit",
        });
      }
    } catch (e) {
      console.error("Failed to decrypt message:", e);
    }
  });

  async function sendMessage(data: LocalMessage) {
    if (!privateKey || !opponentPublicKey) return;

    const sharedKey = await deriveSharedSecret(privateKey, opponentPublicKey);

    const encrypted = await encryptData(data.content || "", sharedKey);
    console.log("encrypted", encrypted);
    const payload = {
      id: data.id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      ciphertext: bufferToBase64(encrypted.ciphertext),
      iv: bufferToBase64(encrypted.iv.buffer),
      editedAt: null,
    };

    // persist
    const dbResult = await sendMessageAction(payload);

    if (!dbResult.success) {
      console.error("Failed to save message:", dbResult.error);
    }

    // realtime
    await publish("message", payload);

    // notify other participants
    for (const userId of opponentUserIds) {
      await realtimeClient.channels
        .get(CHANNELS.USER_NOTIFICATIONS(userId))
        .publish("notification", {
          conversationId: data.conversationId,
          messageId: dbResult.messageId,
          senderId: data.senderId,
          timestamp: data.createdAt,
        });
    }
  }

  async function editMessage(data: LocalMessage) {
    if (!privateKey || !opponentPublicKey) return;

    const sharedKey = await deriveSharedSecret(privateKey, opponentPublicKey);

    const encrypted = await encryptData(data.content || "", sharedKey);
    const payload = {
      id: data.id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      ciphertext: bufferToBase64(encrypted.ciphertext),
      iv: bufferToBase64(encrypted.iv.buffer),
      editedAt: data.editedAt,
    };

    await publish("message:edit", payload);
    await editMessageAction({
      messageId: data.id,
      conversationId: data.conversationId,
      ciphertext: bufferToBase64(encrypted.ciphertext),
      iv: bufferToBase64(encrypted.iv.buffer),
    });
  }

  async function deleteMessage(data: string[]) {
    if (!privateKey || !opponentPublicKey) return;

    await publish("message:delete", data);
    await deleteMessagesAction(data);
  }

  async function deleteConversation(conversationId: string) {
    const channel = realtimeClient.channels.get(CHANNELS.CHAT(conversationId));
    await channel.publish("conversation:delete", { conversationId });
    await deleteConversationAction(conversationId);

    // notify other participants via notifications for sidebar
    for (const userId of opponentUserIds) {
      await realtimeClient.channels
        .get(CHANNELS.USER_NOTIFICATIONS(userId))
        .publish("delete-conversation", { conversationId });
    }
  }

  return {
    sendMessage,
    editMessage,
    deleteMessage,
    publish,
    deleteConversation,
  };
}
