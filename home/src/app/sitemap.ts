import type { MetadataRoute } from "next";
import { getSeo, serverGet, siteUrl } from "@/lib/seo";

export const revalidate = 3600;

// 사이트맵 (docs/32) — 고정 페이지 + 판매중 상품 상세 + 공지사항
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl(await getSeo());
  const now = new Date();
  const fixed: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/process`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/notices`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/partner-apply`, changeFrequency: "monthly", priority: 0.5 },
  ];
  const products = (await serverGet<{ id: number; updatedAt: string | null }[]>("/api/public/products/sitemap", 3600)) ?? [];
  return [
    ...fixed,
    ...products.map((p) => ({
      url: `${base}/products/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
