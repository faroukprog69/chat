"use client";

import { useCryptoStore } from "@/store/useCryptoStore";

export default function PrivateKeyNeed({
  children,
}: {
  children: React.ReactNode;
}) {
  const privateKey = useCryptoStore((state) => state.privateKey);

  return privateKey === null ? null : children;
}
