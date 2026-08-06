import { PageHead } from "@/components/partner/PartnerUI";
import ProductForm from "@/components/partner/ProductForm";

export default function PartnerProductNewPage() {
  return (
    <div className="animate-float-up">
      <PageHead title="상품 등록" sub="위탁 영업대행 상품 등록 · 총수당(7주체 배분) 설정" />
      <ProductForm mode="new" />
    </div>
  );
}
