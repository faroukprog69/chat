"use client";

import * as Ably from "ably";

export const realtimeClient = new Ably.Realtime({
  key: process.env.NEXT_PUBLIC_ABLY_KEY!,
  clientId: "my-first-client",
});
