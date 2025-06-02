import { db } from "@/lib/adapter";
import type { Context } from "@/lib/context";
import { zValidator } from "@hono/zod-validator";
import {
  createPostSchema,
  paginationSchema,
  type PaginatedResponse,
  type Post,
  type SuccessResponse,
} from "@shared/types";
import { createFactory } from "hono/factory";
import { post } from "@/db/schemas/post.schema";
import { user } from "@/db/schemas/auth-schema";
import { HTTPException } from "hono/http-exception";
import { and, asc, countDistinct, desc, eq, is, sql } from "drizzle-orm";
import { getISOFromatDateQuery } from "@/lib/utils";
import { postUpvote } from "@/db/schemas/upvote.schema";
import { z } from "zod";

const factory = createFactory<Context>();

export const createPost = factory.createHandlers(
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

export const getPosts = factory.createHandlers(
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
        createdAt: getISOFromatDateQuery(post.createdAt),
        commentsCount: post.commentsCount,
        author: {
          username: user.name,
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

    return c.json<PaginatedResponse<Post>>(
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

export const upvotePost = factory.createHandlers(
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
