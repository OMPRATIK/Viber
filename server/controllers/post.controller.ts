import { db } from "@/lib/adapter";
import type { Context } from "@/lib/context";
import { zValidator } from "@hono/zod-validator";
import {
  createPostSchema,
  paginationSchema,
  type SuccessRespones,
} from "@shared/types";
import { createFactory } from "hono/factory";
import { post } from "@/db/schemas/post.schema";
import { HTTPException } from "hono/http-exception";
import { and, asc, countDistinct, desc, eq } from "drizzle-orm";

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

    return c.json<SuccessRespones<{ postId: number }>>(
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
    const user = c.get("user");

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
  }
);
