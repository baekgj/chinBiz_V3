import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ProductBrowse from "@/components/landing/ProductBrowse";

export const metadata = { title: "상품 리스트 · 친비즈(ChinBiz)" };

export default function ProductsPage() {
  return (
    <>
      <Header />
      {/* 히어로 */}
      <section className="relative overflow-hidden bg-forest-950 px-5 py-16 sm:py-20">
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-widest text-gold-300">PRODUCT BROWSE</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
            수익 파이프라인을 확장할<br className="hidden sm:block" /> 프리미엄 영업 상품
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-forest-100/80">
            검증된 B2B/B2C 상품을 둘러보고, 내 네트워크에 가장 어울리는 제휴 상품을 발굴하세요.
          </p>
        </div>
      </section>

      {/* 검색·필터·리스트 */}
      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
        <ProductBrowse />
      </section>

      <Footer />
    </>
  );
}
