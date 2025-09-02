import { defineCollection, z } from "astro:content";

const member = defineCollection({
  type: "content",
  schema: z.object({
    id: z.string(),              // "A" / "B"
    name: z.string(),            // 表示名
    github: z.string().optional(),
    avatar: z.string().optional()// /uploads/... or 外部URL
  }),
});

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string(),          // member.id を入れる
    tags: z.array(z.string()).optional(),
    cover: z.string().optional(),
  }),
});

const tracks = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    duration: z.string().optional(),
    lyrics_by: z.string().optional(),
    music_by: z.string().optional(),
    links: z.object({
      spotify: z.string().url().optional(),
      apple: z.string().url().optional(),
      bandcamp: z.string().url().optional(),
      youtube: z.string().url().optional(),
      soundcloud: z.string().url().optional(),
      music_video: z.string().url().optional(),
    }).optional(),
    body: z.string().optional(), // 歌詞や解説
  }),
});

const works = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(), // z.string() → z.date() に統一
    category: z.enum(["release","feature","remix","appearance"]).default("release"),
    type: z.enum(["single","EP","album"]).optional(),
    cover: z.string().optional(),
    tracks: z.array(z.string()).default([]), // tracks の slug 配列
    credits: z.array(z.object({ name: z.string(), role: z.string() })).optional(),
    original_track: z.string().optional(),
    body: z.string().optional(), // リリース情報の詳細
  }),
});

const live = defineCollection({
  type: "content",
  schema: z.object({
    date: z.date(), // z.string() → z.date() に統一
    venue: z.string(),
    city: z.string(),
    doors: z.string().optional(),
    start: z.string().optional(),
    ticketUrl: z.string().url().optional(),
    price: z.string().optional(),
    status: z.enum(["scheduled","soldout","canceled","finished"]).default("scheduled"),
    body: z.string().optional(), // ライブ情報の詳細
  }),
});

export const collections = { tracks, works, live, member, blog };
