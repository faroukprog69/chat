import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  subscription: jsonb("subscription").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
