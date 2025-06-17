import { Hono } from "hono";

import type { Context } from "@/lib/context";
import { protectedRoute } from "@/middlewares/auth.middleware";
import {
  getCommentsByPostId,
  postComment,
  upvoteComment,
} from "@/controllers/comment.controller";

export const commentRouter = new Hono<Context>()
  .post("/:id", protectedRoute, ...postComment)
  .post("/:id/upvote", protectedRoute, ...upvoteComment)
  .get("/:id/comments", ...getCommentsByPostId);
