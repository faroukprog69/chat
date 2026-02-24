export const CHANNELS = {
  CHAT: (roomId: string) => `chat:${roomId}`,
  USER_NOTIFICATIONS: (userId: string) => `user:${userId}`,
  PRESENCE: (teamId: string) => `presence:${teamId}`,
};
