import { PageHead } from "@/components/partner/PartnerUI";
import ProductsSection from "@/components/partner/sections/ProductsSection";

export default function PartnerProductsPage() {
  return (
    <div className="animate-float-up">
      <PageHead title="상품 관리" sub="위탁 영업대행 상품 및 총수당 설정" />
      <ProductsSection />
    </div>
  );
}
