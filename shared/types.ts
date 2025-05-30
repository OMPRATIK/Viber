import { insertPostSchema } from "@/db/schemas/post.schema";
import { z } from "zod";

export type SuccessRespones<T = void> = {
  success: true;
  message: string;
} & (T extends void ? {} : { data: T });

export type ErrorResponse = {
  success: false;
  error: string;
  isFormError?: boolean;
};

export const createPostSchema = insertPostSchema
  .pick({
    title: true,
    url: true,
    content: true,
  })
  .refine((data) => data.url || data.content, {
    message: "Either URL or Content must be provided",
    path: ["url", "content"],
  });

export const sortBySchema = z.enum(["recent", "points"]);
export const orderSchema = z.enum(["asc", "desc"]);

export const paginationSchema = z.object({
  limit: z.number({ coerce: true }).optional().default(10),
  page: z.number({ coerce: true }).optional().default(1),
  sortBy: sortBySchema.optional().default("points"),
  order: orderSchema.optional().default("desc"),
  author: z.string().optional(),
  site: z.string().optional(),
});
