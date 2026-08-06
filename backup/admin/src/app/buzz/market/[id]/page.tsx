"use client";

import { useParams } from "next/navigation";
import { PageHead } from "@/components/buzz/BuzzUI";
import ProductDetail from "@/components/buzz/ProductDetail";

export default function BuzzProductDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <div>
      <PageHead title="상품 상세" sub="상품 정보 및 내 수당 내역" />
      {params?.id && <ProductDetail id={params.id} />}
    </div>
  );
}
