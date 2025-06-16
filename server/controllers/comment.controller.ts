import { z } from "zod";
import type { Context } from "@/lib/context";
import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";
import {
  createCommentSchema,
  type Comment,
  type SuccessResponse,
} from "@shared/types";
import { db } from "@/lib/adapter";
import { comment } from "@/db/schemas/comment.schema";
import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { post } from "@/db/schemas/post.schema";
import { getISOFormatDateQuery } from "@/lib/utils";

const { createHandlers } = createFactory<Context>();

export const postComment = createHandlers(
  zValidator("param", z.object({ id: z.number({ coerce: true }) })),
  zValidator("form", createCommentSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { content } = c.req.valid("form");
    const currUser = c.get("user")!;

    const [newComment] = await db.transaction(async (tx) => {
      const [parentComment] = await tx
        .select({
          id: comment.id,
          postId: comment.postId,
          depth: comment.depth,
        })
        .from(comment)
        .where(eq(comment.id, id))
        .limit(1);

      if (!parentComment) {
        throw new HTTPException(404, { message: "Parent comment not found" });
      }

      const postId = parentComment.postId;
      const [updatedParentComment] = await tx
        .update(comment)
        .set({
          commentsCount: sql`${comment.commentsCount} + 1`,
        })
        .where(eq(comment.id, parentComment.id))
        .returning({ commentsCount: comment.commentsCount });

      const [updatedPost] = await tx
        .update(post)
        .set({
          commentsCount: sql`${post.commentsCount} + 1`,
        })
        .where(eq(post.id, postId))
        .returning({ commentsCount: post.commentsCount });

      if (!updatedParentComment || !updatedPost) {
        throw new HTTPException(500, {
          message: "Failed to add comment",
        });
      }

      return await tx
        .insert(comment)
        .values({
          userId: currUser.id,
          postId: postId,
          parentCommentId: parentComment.id,
          content: content,
          depth: parentComment.depth + 1,
        })
        .returning({
          id: comment.id,
          userId: comment.userId,
          postId: comment.postId,
          content: comment.content,
          points: comment.points,
          depth: comment.depth,
          commentsCount: comment.commentsCount,
          createdAt: getISOFormatDateQuery(comment.createdAt),
          parentCommentId: comment.parentCommentId,
        });
    });

    return c.json<SuccessResponse<Comment>>({
      success: true,
      message: "Comment added successfully",
      data: {
        ...newComment,
        author: {
          id: currUser.id,
          name: currUser.name,
        },
        childComment: [],
        commentUpvote: [],
      } as Comment,
    });
  }
);

export const upvoteComment = createHandlers(
  zValidator("param", z.object({ id: z.number({ coerce: true }) })),
  async (c) => {
    const { id } = c.req.valid("param");
    const currUser = c.get("user")!;
  }
);
