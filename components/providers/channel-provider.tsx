"use client";

import { ChannelProvider } from "ably/react";

export function RealtimeChannel({
  channelName,
  children,
}: {
  channelName: string;
  children: React.ReactNode;
}) {
  return (
    <ChannelProvider channelName={channelName}>{children}</ChannelProvider>
  );
}
