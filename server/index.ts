import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import type { Context } from "./lib/context";
import { postRouter } from "./routes/post.route";
import { setSession } from "./middlewares/session.middleware";
import { commentRouter } from "./routes/comment.route";

const app = new Hono<Context>();

app.use("*", cors({ origin: "http://localhost:5173", credentials: true }));

app.use("*", setSession);
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

const routes = app
  .basePath("/api/v1")
  .route("/posts", postRouter)
  .route("/comments", commentRouter);

app.onError(errorHandler);
app.notFound(notFound);

export default app;
export type ApiRoutes = typeof routes;
