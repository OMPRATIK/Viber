import { auth } from "@/lib/auth";
import type { Context } from "@/lib/context";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export const protectedRoute = createMiddleware<Context>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session || !session.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});
