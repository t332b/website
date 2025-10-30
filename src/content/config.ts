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
    id: z.string().optional(),
    release_id: z.string().optional(), // worksのidとリンク
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
    id: z.string(),
    title: z.string(),
    release_type: z.enum(["single", "ep", "album", "compilation"]).optional(),
    release_date: z.date(),
    release_artist_name: z.string().optional(),
    is_primary_release: z.boolean().default(true),
    cover_url_list: z.array(z.string()).default([]), // ジャケット画像URL配列
    cover_illustration_by: z.string().optional(),
    cover_design_by: z.string().optional(),
    cover_photography_by: z.string().optional(),
    links: z.object({
      spotify: z.string().optional(),
      apple: z.string().optional(),
      bandcamp: z.string().optional(),
      youtube: z.string().optional(),
      soundcloud: z.string().optional(),
      other: z.string().optional(),
      music_video: z.string().optional(),
    }).optional(),
    tracks: z.array(z.string()).default([]), // tracks の slug 配列
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
    status: z.enum(["scheduled","soldout","canceled","finished","ongoing"]).default("scheduled"),
    body: z.string().optional(), // ライブ情報の詳細
  }),
});

export const collections = { tracks, works, live, member, blog };
