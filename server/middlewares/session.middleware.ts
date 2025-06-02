import { auth } from "@/lib/auth";
import type { Context } from "@/lib/context";
import { createMiddleware } from "hono/factory";

export const setSession = createMiddleware<Context>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session || !session.user) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});
