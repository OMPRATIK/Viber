import { Hono } from "hono";

import type { Context } from "@/lib/context";
import { protectedRoute } from "@/middlewares/auth.middleware";
import {
  createPost,
  getPosts,
  upvotePost,
} from "@/controllers/post.controller";

export const postRouter = new Hono<Context>()
  .post("/", protectedRoute, ...createPost)
  .get("/", ...getPosts)
  .post("/:id/upvote", protectedRoute, ...upvotePost);
