import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { InferSelectModel, relations, sql } from "drizzle-orm";
import { user } from "./auth_schema";

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    type: text("type").$type<"direct" | "group">().notNull(),
    title: text("title"),
    avatar: text("avatar"),

    directKey: text("direct_key"),

    lastMessageId: text("last_message_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("direct_unique_idx")
      .on(table.directKey)
      .where(sql`type = 'direct'`),
  ],
);

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    role: text("role").$type<"admin" | "member">().notNull().default("member"),
    lastReadMessageId: text("last_read_message_id"),

    joinedAt: timestamp("joined_at").notNull().defaultNow(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("participants_user_idx").on(table.userId),
    index("participants_conversation_idx").on(table.conversationId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    type: text("type").$type<"text" | "image" | "file" | "system">().notNull(),

    content: text("content"),
    iv: text("iv"),

    replyToMessageId: text("reply_to_message_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [index("messages_conversation_idx").on(table.conversationId)],
);

export const messageAttachments = pgTable("message_attachments", {
  id: text("id").primaryKey(),
  messageId: text("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: text("type").notNull(),
  size: integer("size"),
});

export const userRelationsWithMessages = relations(user, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantsRelations = relations(
  conversationParticipants,
  ({ one }) => ({
    user: one(user, {
      fields: [conversationParticipants.userId],
      references: [user.id],
    }),
    conversation: one(conversations, {
      fields: [conversationParticipants.conversationId],
      references: [conversations.id],
    }),
  }),
);

export const messagesRelations = relations(messages, ({ one, many }) => ({
  sender: one(user, { fields: [messages.senderId], references: [user.id] }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  attachments: many(messageAttachments),
}));

export type Conversation = InferSelectModel<typeof conversations>;
