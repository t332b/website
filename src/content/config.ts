import { defineCollection, z } from "astro:content";

export const collections = {
  member: defineCollection({
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
      author: z.string(),          // member.id を入れる
      tags: z.array(z.string()).optional(),
      cover: z.string().optional(),
    }),
    // デフォルトのレイアウトを指定
    frontmatter: {
      layout: "../../layouts/BlogPost.astro"
    }
  }),
};
