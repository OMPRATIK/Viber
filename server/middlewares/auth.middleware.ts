import type { Context } from "@/lib/context";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export const protectedRoute = createMiddleware<Context>(async (c, next) => {
  const currUser = c.get("user");

  if (!currUser) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  return next();
});
