// src/content/config.ts
import { defineCollection, z } from 'astro:content';

export const collections = {
  diary: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      date: z.date(),                      // ← 日付でソート＆絞り込みに使う
      author: z.enum(['A','B']),           // ← 著者をA/Bで保持（あとで名前にしてもOK）
      tags: z.array(z.string()).optional(),
      cover: z.string().optional(),
    }),
  }),
};
