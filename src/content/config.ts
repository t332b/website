import { defineCollection, z } from "astro:content";

// CMS の datetime ウィジェットは未入力時に空文字列 '' を書き込むため、
// z.coerce.date() に渡す前に undefined へ正規化する
const optionalDate = () =>
  z.preprocess((val) => (val === "" ? undefined : val), z.coerce.date().optional());

const member = defineCollection({
  type: "content",
  schema: z.object({
    id: z.string(),              // "A" / "B" / "onomatopedaijin" / "thamesbeat" など
    name: z.string(),            // 表示名
    bio: z.string().optional(),  // 自己紹介
    github: z.string().optional(),
    avatar: z.string().optional(), // /uploads/... or 外部URL
  }),
});

const notes = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string(),          // member.id を入れる
    tags: z.array(z.string()).optional(),
    is_public: z.boolean().default(true),
    image: z.string().optional(), // ヘッダー画像 URL（Cloudinary 等）
  }),
});

const tracks = defineCollection({
  type: "content",
  schema: z.object({
    id: z.string().optional(),
    works_id: z.string().optional(), // worksのidとリンク
    title: z.string(),
    track_number: z.number().optional(),
    track_type: z.string().optional(), // featuring / remix など参加形態
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
    title: z.string(), // イベント名（必須）
    startDate: optionalDate(), // 開始日
    startTime: z.string().optional(), // 開始時刻（例: 19:00）
    endDate: optionalDate(), // 終了日（日をまたぐ場合）
    endTime: z.string().optional(), // 終了時刻
    venue: z.string().optional(),
    city: z.string().optional(),
    ticketUrl: z
      .string()
      .optional()
      .transform((s) => {
        const t = (s ?? "").trim();
        if (t === "") return undefined;
        try {
          new URL(t);
          return t;
        } catch {
          return undefined; // "未定", "TBD" 等は URL なしとして扱う
        }
      }),
    flyer: z.string().optional(), // フライヤー画像URL（Cloudinary等）
    body: z.string().optional(), // 備考
  }),
});

export const collections = { tracks, works, live, member, notes };
