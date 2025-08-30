import { defineCollection, z } from "astro:content";

export const collections = {
  authors: defineCollection({
    type: "content",
    schema: z.object({
      id: z.string(),              // "A" / "B"
      name: z.string(),            // 表示名
      github: z.string().optional(),
      avatar: z.string().optional()// /uploads/... or 外部URL
    }),
  }),

  blog: defineCollection({
    type: "content",
    schema: z.object({
      title: z.string(),
      date: z.date(),
      author: z.string(),          // authors.id を入れる
      tags: z.array(z.string()).optional(),
    }),
  }),
};
