import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { post } from "./post.schema";
import { user } from "./auth-schema";
import { comment } from "./comment.schema";

export const postUpvote = pgTable("post_upvote", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const postUpvoteRelation = relations(postUpvote, ({ one }) => ({
  post: one(post, {
    fields: [postUpvote.postId],
    references: [post.id],
    relationName: "postUpvote",
  }),
  user: one(user, {
    fields: [postUpvote.userId],
    references: [user.id],
    relationName: "user",
  }),
}));

export const commentUpvote = pgTable("comment_upvote", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const commentUpvoteRelation = relations(commentUpvote, ({ one }) => ({
  comment: one(comment, {
    fields: [commentUpvote.commentId],
    references: [comment.id],
    relationName: "commentUpvotes",
  }),
  user: one(user, {
    fields: [commentUpvote.userId],
    references: [user.id],
    relationName: "user",
  }),
}));
