import { encode } from "./encoding";

export async function encryptData(data: string, key: CryptoKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // IV فريد لكل عملية
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encode(data),
  );

  return {
    ciphertext: encrypted,
    iv: iv,
  };
}
