"use client";

import { useChannel } from "ably/react";
import type { Message } from "ably";
import { deriveSharedSecret } from "@/lib/crypto/exchange";
import { decryptData } from "@/lib/crypto/decrypt";
import { base64ToBuffer, bufferToBase64 } from "@/lib/crypto/encoding";
import { encryptData } from "@/lib/crypto/encrypt";
import {
  sendMessageToDbAction,
  updateLastReadMessage,
} from "@/app/actions/chat";

export function useChatChannel({
  channelName,
  privateKey,
  opponentPublicKey,
  onMessage,
}: {
  channelName: string;
  privateKey: CryptoKey | null;
  opponentPublicKey: string;
  onMessage?: (msg: any) => void;
}) {
  const { publish } = useChannel(channelName, async (msg: Message) => {
    try {
      if (!privateKey) return;

      const sharedKey = await deriveSharedSecret(privateKey, opponentPublicKey);

      const decryptedContent = await decryptData(
        base64ToBuffer(msg.data.ciphertext),
        sharedKey,
        new Uint8Array(base64ToBuffer(msg.data.iv)),
      );
      await updateLastReadMessage({
        conversationId: msg.data.conversationId,
        messageId: msg.data.id,
      });

      onMessage?.({
        ...msg.data,
        content: decryptedContent,
      });
    } catch (e) {
      console.error("Failed to decrypt message:", e);
    }
  });

  async function sendMessage(data: {
    id: string;
    content: string;
    senderId: string;
    conversationId: string;
  }) {
    if (!privateKey || !opponentPublicKey) return;

    const sharedKey = await deriveSharedSecret(privateKey, opponentPublicKey);

    console.log(
      "sharedKey sender:",
      await crypto.subtle.exportKey("raw", sharedKey),
    );
    const encrypted = await encryptData(data.content, sharedKey);

    const payload = {
      id: data.id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      ciphertext: bufferToBase64(encrypted.ciphertext),
      iv: bufferToBase64(encrypted.iv.buffer),
    };

    // realtime
    await publish("message", payload);

    // persist
    const dbResult = await sendMessageToDbAction(payload);

    if (!dbResult.success) {
      console.error("Failed to save message:", dbResult.error);
    }
  }

  return { sendMessage };
}
