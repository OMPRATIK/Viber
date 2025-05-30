import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./adapter.ts";
import * as authSchema from "../db/schemas/auth-schema.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["http://localhost:5173"],
});
