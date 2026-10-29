import type { Metadata } from "next";
import ProductDetailView, { type Detail } from "@/components/product/ProductDetailView";
import { absoluteMedia, getSeo, plainText, serverGet, siteUrl, splitKeywords } from "@/lib/seo";

// 비로그인 공개 상세 — 검색엔진 수집용 (단가·수당 미포함 응답)
type PublicDetail = {
  id: number; name: string; partnerName?: string | null; categoryName?: string | null;
  images: string[]; salePrice?: number | null; monthlyCare?: boolean; description?: string | null;
  brand?: string | null; modelName?: string | null; manufacturer?: string | null; origin?: string | null;
  seoTitle?: string | null; seoDescription?: string | null; seoKeywords?: string | null;
};

type Props = { params: Promise<{ id: string }> };

/** /products/15&refId=..&ordNo=.. 형태(카카오 동의 링크)도 상품 id 만 추출 */
const productIdOf = (raw: string) => decodeURIComponent(raw).split("&")[0];

const getDetail = (id: string) =>
  /^\d+$/.test(id) ? serverGet<PublicDetail>(`/api/public/products/${id}`, 600) : Promise.resolve(null);

/** 상품별 메타태그 (docs/32) — 상품 SEO 입력값 우선, 없으면 상품명·설명 요약 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = productIdOf((await params).id);
  const [d, seo] = await Promise.all([getDetail(id), getSeo()]);
  if (!d) return { title: "상품 상세 · 친비즈(ChinBiz)" };
  const base = siteUrl(seo);
  const title = d.seoTitle || `${d.name}${d.partnerName ? ` - ${d.partnerName}` : ""} · 친비즈(ChinBiz)`;
  const description = d.seoDescription || plainText(d.description) || `${d.name} — 친비즈 버즈마케팅 영업 상품`;
  const keywords = splitKeywords([d.seoKeywords, d.name, d.categoryName, d.brand, d.partnerName].filter(Boolean).join(","));
  const images = d.images.map((p) => absoluteMedia(base, p)).filter(Boolean) as string[];
  return {
    title, description, keywords,
    alternates: { canonical: `${base}/products/${d.id}` },
    openGraph: { type: "website", locale: "ko_KR", siteName: "친비즈(ChinBiz)", url: `${base}/products/${d.id}`, title, description, images },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images },
  };
}

/** 상품 상세 — 구조화 데이터(schema.org Product, JSON-LD) + 클라이언트 상세 화면 */
export default async function ProductDetailPage({ params }: Props) {
  const id = productIdOf((await params).id);
  const [d, seo] = await Promise.all([getDetail(id), getSeo()]);
  const base = siteUrl(seo);
  const jsonLd = d ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: d.name,
    description: d.seoDescription || plainText(d.description, 300) || undefined,
    image: d.images.map((p) => absoluteMedia(base, p)).filter(Boolean),
    sku: String(d.id),
    mpn: d.modelName || undefined,
    model: d.modelName || undefined,
    category: d.categoryName || undefined,
    brand: d.brand || d.partnerName ? { "@type": "Brand", name: d.brand || d.partnerName } : undefined,
    manufacturer: d.manufacturer ? { "@type": "Organization", name: d.manufacturer } : undefined,
    countryOfOrigin: d.origin || undefined,
    offers: d.salePrice ? {
      "@type": "Offer", url: `${base}/products/${d.id}`, priceCurrency: "KRW", price: d.salePrice,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: d.partnerName || "친비즈(ChinBiz)" },
    } : undefined,
  } : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      )}
      <ProductDetailView initial={d as unknown as Detail | null} />
    </>
  );
}
