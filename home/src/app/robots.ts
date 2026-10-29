import type { MetadataRoute } from "next";
import { getSeo, siteUrl } from "@/lib/seo";

// 검색로봇 수집 정책 (docs/32) — 공개 페이지 허용, 계정/동의 흐름은 제외
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl(await getSeo());
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/login", "/signup", "/find-password"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
