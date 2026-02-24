export const encode = (text: string) => new TextEncoder().encode(text);
export const decode = (buffer: ArrayBuffer) => new TextDecoder().decode(buffer);

// للتحويل لـ Base64 عشان نخزن في الداتابيز
export const bufferToBase64 = (buffer: ArrayBuffer) =>
  window.btoa(String.fromCharCode(...new Uint8Array(buffer)));

export const base64ToBuffer = (base64: string) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};
