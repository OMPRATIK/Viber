import { z } from "zod";
import type { Context } from "@/lib/context";
import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";
import {
  createCommentSchema,
  paginationSchema,
  type Comment,
  type PaginatedResponse,
  type SuccessResponse,
} from "@shared/types";
import { db } from "@/lib/adapter";
import { comment } from "@/db/schemas/comment.schema";
import { and, asc, countDistinct, desc, eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { post } from "@/db/schemas/post.schema";
import { getISOFormatDateQuery } from "@/lib/utils";
import { commentUpvote } from "@/db/schemas/upvote.schema";

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
    let pointsChange: -1 | 1 = 1;

    const points = await db.transaction(async (tx) => {
      const [existingUpvote] = await tx
        .select()
        .from(commentUpvote)
        .where(
          and(
            eq(commentUpvote.commentId, id),
            eq(commentUpvote.userId, currUser.id)
          )
        )
        .limit(1);

      pointsChange = existingUpvote ? -1 : 1;

      const [updated] = await tx
        .update(comment)
        .set({ points: sql`${comment.points} + ${pointsChange}` })
        .where(eq(comment.id, id))
        .returning({ points: comment.points });

      if (!updated) {
        throw new HTTPException(404, { message: "Comment not found" });
      }

      if (existingUpvote) {
        await tx
          .delete(commentUpvote)
          .where(eq(commentUpvote.id, existingUpvote.id));
      } else {
        await tx
          .insert(commentUpvote)
          .values({ commentId: id, userId: currUser.id });
      }

      return updated.points;
    });

    return c.json<
      SuccessResponse<{ count: number; commentUpvotes: { userId: string }[] }>
    >({
      success: true,
      message: `Comment ${
        pointsChange > 0 ? "upvoted" : "downvoted"
      } successfully`,
      data: {
        count: points,
        commentUpvotes: pointsChange > 0 ? [{ userId: currUser.id }] : [],
      },
    });
  }
);

export const getCommentsByPostId = createHandlers(
  zValidator("param", z.object({ id: z.number({ coerce: true }) })),
  zValidator("query", paginationSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const currUser = c.get("user");

    const { limit, page, sortBy, order } = c.req.valid("query");
    const offset = (page - 1) * limit;

    const sortByColumn =
      sortBy === "points" ? comment.points : comment.createdAt;
    const sortOrder = order === "asc" ? asc(sortByColumn) : desc(sortByColumn);

    const [count] = await db
      .select({
        count: countDistinct(comment.id),
      })
      .from(comment)
      .where(eq(comment.parentCommentId, id));

    if (!count) {
      throw new HTTPException(404, { message: "No comments found" });
    }

    const comments = await db.query.comment.findMany({
      where: and(eq(comment.parentCommentId, id)),
      orderBy: sortOrder,
      limit,
      offset,
      with: {
        author: {
          columns: {
            name: true,
            id: true,
          },
        },
        commentUpvote: {
          columns: {
            userId: true,
          },
          where: eq(commentUpvote.userId, currUser?.id ?? ""),
          limit: 1,
        },
      },
      extras: {
        createdAt: getISOFormatDateQuery(comment.createdAt).as("created_at"),
      },
    });

    return c.json<PaginatedResponse<Comment[]>>({
      success: true,
      message: "Comments fetched successfully",
      data: comments as Comment[],
      pagination: {
        page,
        totalPages: Math.ceil(count.count / limit),
      },
    });
  }
);
