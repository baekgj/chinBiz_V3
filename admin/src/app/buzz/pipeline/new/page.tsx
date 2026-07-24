import { Suspense } from "react";
import { PageHead } from "@/components/buzz/BuzzUI";
import SaleForm from "@/components/buzz/SaleForm";

export default function BuzzSaleNewPage() {
  return (
    <div>
      <PageHead title="1차 영업 등록" sub="상품 선택 + 고객 기본정보 등록" />
      <Suspense fallback={null}><SaleForm /></Suspense>
    </div>
  );
}
