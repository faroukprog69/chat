import { decode } from "./encoding";

export async function decryptData(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
) {
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return decode(decrypted);
  } catch (e) {
    return null;
  }
}
