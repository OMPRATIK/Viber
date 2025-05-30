import type { ErrorResponse } from "@shared/types";
import type { ErrorHandler, NotFoundHandler } from "hono";

export const notFound: NotFoundHandler = (c) => {
  return c.json<ErrorResponse>(
    {
      success: false,
      error: `Not Found - [${c.req.method}]:[${c.req.url}]`,
    },
    404
  );
};
