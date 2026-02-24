import { base64ToBuffer } from "./encoding";

/**
 * توليد مفتاح AES مشترك بين شخصين
 */
export async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  peerPublicKeyJWK: string,
) {
  // 1. استيراد مفتاح الطرف الآخر العام
  const peerPublicKey = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(peerPublicKeyJWK),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );

  // 2. اشتقاق الـ Shared Bits
  const sharedBits = await window.crypto.subtle.deriveBits(
    { name: "ECDH", public: peerPublicKey },
    myPrivateKey,
    256,
  );

  // 3. تحويل الـ Bits إلى مفتاح AES-GCM حقيقي للتشفير
  return await window.crypto.subtle.importKey(
    "raw",
    sharedBits,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}
