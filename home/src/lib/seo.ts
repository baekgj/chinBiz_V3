// 서버(SSR/메타데이터) 전용 BE 조회 — 검색엔진 최적화(docs/32).
// HOME 과 BE 는 같은 서버에서 동작 → 서버 측 호출은 내부 주소(localhost:9001)를 기본으로 사용.
export const SERVER_API =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:9001";

/** 본사 [환경설정] 검색엔진 메타태그 (app_setting seo_*) */
export type SeoSettings = Partial<Record<
  "seo_title" | "seo_description" | "seo_keywords" | "seo_author" | "seo_og_image" |
  "seo_site_url" | "seo_naver_verification" | "seo_google_verification", string>>;

export const DEFAULT_TITLE = "친비즈(ChinBiz) · 영업대행 ERP 플랫폼";
export const DEFAULT_DESCRIPTION =
  "계약부터 정산까지, 영업의 모든 흐름을 한 곳에서. 친비즈는 영업 파트너와 기업을 연결하고 실시간 성과·수당 정산을 자동화하는 영업대행 ERP입니다.";
export const DEFAULT_SITE_URL = "https://chinbiz.kr";

/** BE 공개 API GET — 실패(BE 미기동·빌드 시) 시 null. revalidate 초 단위 캐시 */
export async function serverGet<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const r = await fetch(`${SERVER_API}${path}`, { next: { revalidate }, headers: { Accept: "application/json" } });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function getSeo(): Promise<SeoSettings> {
  return (await serverGet<SeoSettings>("/api/public/seo")) ?? {};
}

/** 대표 URL(끝 슬래시 제거) */
export function siteUrl(seo: SeoSettings): string {
  return (seo.seo_site_url || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

/** 콤마 구분 키워드 → 배열 */
export function splitKeywords(s?: string | null): string[] | undefined {
  const arr = (s ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  return arr.length ? arr : undefined;
}

/** 업로드 이미지(/uploads/..) → 절대 URL (og:image·구조화 데이터용) */
export function absoluteMedia(base: string, p?: string | null): string | undefined {
  if (!p) return undefined;
  const i = p.indexOf("/uploads/");
  if (i >= 0) return `${base}${p.slice(i)}`;
  if (/^https?:\/\//i.test(p)) return p;
  return `${base}${p.startsWith("/") ? "" : "/"}${p}`;
}

/** HTML → 평문 요약 */
export function plainText(html?: string | null, max = 160): string {
  const s = (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
