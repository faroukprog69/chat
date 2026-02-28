import { z } from "zod";
import { ChatDal } from "./chat-dal";

export type ConversationsArray = Awaited<
  ReturnType<ChatDal["getMyConversations"]>
>;
export type ConversationEntry = ConversationsArray[number];

export type LocalMessage = Awaited<ReturnType<ChatDal["getMessages"]>>[number];

export const createChatSchema = z
  .object({
    type: z.enum(["direct", "group"]),
    title: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "group") {
      if (!data.title || data.title.trim().length === 0) {
        ctx.addIssue({
          path: ["title"],
          code: z.ZodIssueCode.custom,
          message: "Title is required for groups",
        });
      }
    }

    if (data.type === "direct") {
      if (!data.username || data.username.trim().length === 0) {
        ctx.addIssue({
          path: ["username"],
          code: z.ZodIssueCode.custom,
          message: "Username is required",
        });
      }
    }
  });
export const conversationOutputSchema = z.object({
  id: z.string(),
  type: z.enum(["direct", "group"]),
  title: z.string().nullable(),
  updatedAt: z.date(),
  lastMessage: z.any().optional(),
  participants: z.array(z.any()),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
