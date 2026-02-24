export async function deriveSharedSecret(
  privateKey: CryptoKey,
  opponentPublicKeyJWK: string,
) {
  const opponentKey = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(opponentPublicKeyJWK),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );

  const sharedSecret = await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: opponentKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  return sharedSecret;
}
