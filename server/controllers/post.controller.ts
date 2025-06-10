import { db } from "@/lib/adapter";
import type { Context } from "@/lib/context";
import { zValidator } from "@hono/zod-validator";
import {
  createCommentSchema,
  createPostSchema,
  paginationSchema,
  type Comment,
  type PaginatedResponse,
  type Post,
  type SuccessResponse,
} from "@shared/types";
import { createFactory } from "hono/factory";
import { post } from "@/db/schemas/post.schema";
import { user } from "@/db/schemas/auth-schema";
import { HTTPException } from "hono/http-exception";
import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  is,
  isNull,
  sql,
} from "drizzle-orm";
import { getISOFormatDateQuery } from "@/lib/utils";
import { commentUpvote, postUpvote } from "@/db/schemas/upvote.schema";
import { z } from "zod";
import { comment } from "@/db/schemas/comment.schema";

const { createHandlers } = createFactory<Context>();

export const createPost = createHandlers(
  zValidator("form", createPostSchema),
  async (c) => {
    const { title, url, content } = c.req.valid("form");
    const user = c.get("user")!;

    const [newPost] = await db
      .insert(post)
      .values({
        title,
        content,
        url,
        userId: user.id,
      })
      .returning({ id: post.id });

    if (!newPost) {
      throw new HTTPException(400, { message: "Failed to create post" });
    }

    return c.json<SuccessResponse<{ postId: number }>>(
      {
        success: true,
        message: "Post created successfully",
        data: { postId: newPost.id },
      },
      201
    );
  }
);

export const getPosts = createHandlers(
  zValidator("query", paginationSchema),
  async (c) => {
    const { limit, page, sortBy, order, author, site } = c.req.valid("query");
    const currUser = c.get("user");

    const offset = (page - 1) * limit;
    const sortByColumn = sortBy === "points" ? post.points : post.createdAt;
    const sortOrder = order === "asc" ? asc(sortByColumn) : desc(sortByColumn);

    const [count] = await db
      .select({ count: countDistinct(post.id) })
      .from(post)
      .where(
        and(
          author ? eq(post.userId, author) : undefined,
          site ? eq(post.url, site) : undefined
        )
      );

    if (!count) {
      throw new HTTPException(404, { message: "No posts found" });
    }

    const postsQuery = db
      .select({
        id: post.id,
        title: post.title,
        url: post.url,
        points: post.points,
        createdAt: getISOFormatDateQuery(post.createdAt),
        commentsCount: post.commentsCount,
        author: {
          name: user.name,
          id: user.id,
        },
        isUpvoted: currUser
          ? sql<boolean>`CASE WHEN ${postUpvote.userId} IS NOT NULL THEN true ELSE false END`
          : sql<boolean>`false`,
      })
      .from(post)
      .leftJoin(user, eq(post.userId, user.id))
      .orderBy(sortOrder)
      .limit(limit)
      .offset(offset)
      .where(
        and(
          author ? eq(post.userId, author) : undefined,
          site ? eq(post.url, site) : undefined
        )
      );

    if (currUser) {
      postsQuery.leftJoin(
        postUpvote,
        and(eq(postUpvote.postId, post.id), eq(postUpvote.userId, currUser.id))
      );
    }

    const posts = await postsQuery;

    if (posts.length === 0) {
      throw new HTTPException(404, { message: "No posts found" });
    }

    return c.json<PaginatedResponse<Post[]>>(
      {
        success: true,
        message: "Posts fetched successfully",
        data: posts as Post[],
        pagination: { page, totalPages: Math.ceil(count.count / limit) },
      },
      200
    );
  }
);

export const upvotePost = createHandlers(
  zValidator("param", z.object({ id: z.number({ coerce: true }) })),
  async (c) => {
    const { id } = c.req.valid("param");
    const currUser = c.get("user")!;

    let pointsChange: -1 | 1 = 1;

    const points = await db.transaction(async (tx) => {
      const [existingUpvote] = await tx
        .select()
        .from(postUpvote)
        .where(
          and(eq(postUpvote.postId, id), eq(postUpvote.userId, currUser.id))
        )
        .limit(1);

      pointsChange = existingUpvote ? -1 : 1;

      const [updated] = await tx
        .update(post)
        .set({
          points: sql`${post.points} + ${pointsChange}`,
        })
        .where(eq(post.id, id))
        .returning({ points: post.points });

      if (!updated) {
        throw new HTTPException(404, { message: "Post not found" });
      }

      if (existingUpvote) {
        await tx
          .delete(postUpvote)
          .where(and(eq(postUpvote.id, existingUpvote.id)));
      } else {
        await tx.insert(postUpvote).values({
          postId: id,
          userId: currUser.id,
        });
      }

      return updated.points;
    });

    return c.json<SuccessResponse<{ count: number; isUpvoted: boolean }>>(
      {
        success: true,
        message: `Post ${
          pointsChange > 0 ? "upvoted" : "downvoted"
        } successfully`,
        data: { count: points, isUpvoted: pointsChange > 0 },
      },
      200
    );
  }
);

export const commentPost = createHandlers(
  zValidator("param", z.object({ id: z.number({ coerce: true }) })),
  zValidator("form", createCommentSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { content } = c.req.valid("form");
    const user = c.get("user")!;

    const [newComment] = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(post)
        .set({ commentsCount: sql`${post.commentsCount} + 1` })
        .where(eq(post.id, id))
        .returning({ commentsCount: post.commentsCount });

      if (!updated) {
        throw new HTTPException(404, { message: "Post not found" });
      }

      return await tx
        .insert(comment)
        .values({
          content,
          userId: user.id,
          postId: id,
        })
        .returning({
          id: comment.id,
          userId: comment.userId,
          content: comment.content,
          points: comment.points,
          parentCommentId: comment.parentCommentId,
          createdAt: getISOFormatDateQuery(comment.createdAt),
          commentsCount: comment.commentsCount,
          depth: comment.depth,
        });
    });

    return c.json<SuccessResponse<Comment>>({
      success: true,
      message: "Comment added successfully",
      data: {
        ...newComment,
        commentUpvote: [],
        childComment: [],
        author: {
          name: user.name,
          id: user.id,
        },
      } as Comment,
    });
  }
);

export const getComments = createHandlers(
  zValidator("param", z.object({ id: z.number({ coerce: true }) })),
  zValidator(
    "query",
    paginationSchema.extend({
      includeChildren: z.boolean({ coerce: true }).optional(),
    })
  ),
  async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.valid("param");
    const { limit, page, includeChildren, sortBy, order } =
      c.req.valid("query");

    const offset = (page - 1) * limit;

    const [postExists] = await db
      .select({ exists: sql`1` })
      .from(post)
      .where(eq(post.id, id))
      .limit(1);

    if (!postExists) {
      throw new HTTPException(404, { message: "Post not found" });
    }

    const sortByColumn =
      sortBy === "points" ? comment.points : comment.createdAt;
    const sortOrder = order === "asc" ? asc(sortByColumn) : desc(sortByColumn);

    const [count] = await db
      .select({ count: countDistinct(comment.id) })
      .from(comment)
      .where(and(eq(comment.postId, id), isNull(comment.parentCommentId)));

    if (!count) {
      throw new HTTPException(404, { message: "No comments found" });
    }

    const comments = await db.query.comment.findMany({
      where: and(eq(comment.postId, id), isNull(comment.parentCommentId)),
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
          where: eq(commentUpvote.userId, user?.id ?? ""),
          limit: 1,
        },
        childComment: {
          limit: includeChildren ? 2 : 0,
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
              where: eq(commentUpvote.userId, user?.id ?? ""),
              limit: 1,
            },
          },
          orderBy: sortOrder,
          extras: {
            createdAt: getISOFormatDateQuery(comment.createdAt).as(
              "created_at"
            ),
          },
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

export const getPostById = createHandlers(
  zValidator("param", z.object({ id: z.number({ coerce: true }) })),
  async (c) => {
    const currUser = c.get("user")!;

    const { id } = c.req.valid("param");
    const postQuery = db
      .select({
        id: post.id,
        title: post.title,
        url: post.url,
        points: post.points,
        content: post.content,
        createdAt: getISOFormatDateQuery(post.createdAt),
        commentsCount: post.commentsCount,
        author: {
          name: user.name,
          id: user.id,
        },
        isUpvoted: currUser
          ? sql<boolean>`CASE WHEN ${postUpvote.userId} IS NOT NULL THEN true ELSE false END`
          : sql<boolean>`false`,
      })
      .from(post)
      .leftJoin(user, eq(post.userId, user.id))
      .where(eq(post.id, id));

    if (currUser) {
      postQuery.leftJoin(
        postUpvote,
        and(eq(postUpvote.postId, post.id), eq(postUpvote.userId, currUser.id))
      );
    }

    const [postData] = await postQuery;
    if (!postData) {
      throw new HTTPException(404, { message: "Post not found" });
    }

    return c.json<SuccessResponse<Post>>(
      {
        success: true,
        message: "Post fetched successfully",
        data: postData as Post,
      },
      200
    );
  }
);
