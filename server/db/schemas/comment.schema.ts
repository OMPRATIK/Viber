import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { post } from "./post.schema";
import { commentUpvote } from "./upvote.schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const comment = pgTable("comment", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  postId: integer("post_id").notNull(),
  parentCommentId: integer("parent_comment_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  depth: integer("depth").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  points: integer("points").default(0).notNull(),
});

export const commentRelation = relations(comment, ({ one, many }) => ({
  author: one(user, {
    fields: [comment.userId],
    references: [user.id],
  }),
  parentComment: one(comment, {
    fields: [comment.parentCommentId],
    references: [comment.id],
    relationName: "parentToChildComment",
  }),
  childComment: many(comment, {
    relationName: "parentToChildComment",
  }),
  post: one(post, {
    fields: [comment.postId],
    references: [post.id],
  }),
  commentUpvote: many(commentUpvote),
}));

export const insertCommentsSchema = createInsertSchema(comment, {
  content: z.string().min(3, { message: "Comment must be at least 3 chars" }),
});
