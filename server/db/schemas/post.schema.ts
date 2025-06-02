import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { postUpvote } from "./upvote.schema";
import { comment } from "./comment.schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const post = pgTable("post", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  content: text("content"),
  points: integer("points").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertPostSchema = createInsertSchema(post, {
  title: z.string().min(3, { message: "Title must be atleast 3 chars" }),
  url: z
    .string()
    .trim()
    .url({ message: "Must be a valid URL" })
    .optional()
    .or(z.literal("")),
  content: z.string().optional(),
});

export const postRelation = relations(post, ({ one, many }) => ({
  author: one(user, {
    fields: [post.userId],
    references: [user.id],
  }),
  postUpvote: many(postUpvote),
  comment: many(comment),
}));
