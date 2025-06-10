import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import * as userSchema from "@/db/schemas/auth-schema";
import * as postSchema from "@/db/schemas/post.schema";
import * as commentSchema from "@/db/schemas/comment.schema";
import * as upvoteSchema from "@/db/schemas/upvote.schema";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const processEnv = EnvSchema.parse(process.env);
const queryClient = postgres(processEnv.DATABASE_URL);
export const db = drizzle(queryClient, {
  schema: {
    ...userSchema,
    ...postSchema,
    ...commentSchema,
    ...upvoteSchema,
  },
});
