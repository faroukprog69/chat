import argon2 from "argon2-browser/dist/argon2-bundled.min.js";

export async function deriveMasterKey(password: string, salt: string) {
  const result = await argon2.hash({
    pass: password,
    salt: salt, // الـ Salt اللي رح نخزنه في Neon
    time: 2,
    mem: 65536,
    hashLen: 32,
    type: argon2.ArgonType.Argon2id,
  });
  const keyMaterial = new Uint8Array(result.hash);

  return await window.crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}
