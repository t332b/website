/**
 * 各種サービスのURLから埋め込み用 iframe URL を取得する
 */
export type EmbedService = "youtube" | "spotify" | "bandcamp" | "apple";

export interface EmbedInfo {
  service: EmbedService;
  embedUrl: string;
}

export function getEmbedInfoFromUrl(url: string): EmbedInfo | null {
  if (!url || typeof url !== "string") return null;
  const u = url.trim();
  try {
    if (/youtube\.com|youtu\.be/i.test(u)) {
      const match = u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      if (match) {
        return { service: "youtube", embedUrl: `https://www.youtube.com/embed/${match[1]}` };
      }
    }
    if (/spotify\.com/i.test(u)) {
      const match = u.match(/spotify\.com\/(?:intl-[^/]+\/)?(track|album|playlist)\/([a-zA-Z0-9]+)(?:\?|&|$)/);
      if (match) {
        const type = match[1];
        const id = match[2];
        return {
          service: "spotify",
          embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`,
        };
      }
    }
    if (/bandcamp\.com/i.test(u)) {
      const match = u.match(/bandcamp\.com\/(album|track)\/([^/?]+)/);
      if (match) {
        return {
          service: "bandcamp",
          embedUrl: `https://bandcamp.com/EmbeddedPlayer/${match[1]}=${match[2]}/size=large/bgcol=ffffff/linkcol=0687f5/transparent=true/`,
        };
      }
    }
    if (/music\.apple\.com/i.test(u)) {
      // Apple Music は基本的に「music.apple.com の URL をそのまま embed.music.apple.com に差し替え」で OK
      // パス構造やクエリが多少違っても柔軟に対応できるよう、細かくパースしすぎない
      const embedUrl = u.replace(/^https?:\/\/music\.apple\.com/i, "https://embed.music.apple.com");
      return {
        service: "apple",
        embedUrl,
      };
    }
  } catch {
    // ignore
  }
  return null;
}
