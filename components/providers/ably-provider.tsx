"use client";

import { AblyProvider } from "ably/react";
import { realtimeClient } from "@/realtime/client";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  return <AblyProvider client={realtimeClient}>{children}</AblyProvider>;
}
