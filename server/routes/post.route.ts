import { Hono } from "hono";

import type { Context } from "@/lib/context";
import { protectedRoute } from "@/middlewares/auth.middleware";
import {
  commentPost,
  createPost,
  getComments,
  getPostById,
  getPosts,
  upvotePost,
} from "@/controllers/post.controller";

export const postRouter = new Hono<Context>()
  .post("/", protectedRoute, ...createPost)
  .get("/", ...getPosts)
  .post("/:id/upvote", protectedRoute, ...upvotePost)
  .post("/:id/comment", protectedRoute, ...commentPost)
  .get("/:id/comments", ...getComments)
  .get("/:id", ...getPostById);
