"use client";

import Link from "next/link";
import ProductForm from "@/components/master/ProductForm";

export default function NewProductPage() {
  return (
    <div className="animate-float-up">
      <div className="mb-4">
        <Link href="/master/products" className="text-sm text-slate-400 hover:text-slate-200">← 상품 리스트</Link>
        <h1 className="mt-1 text-xl font-black text-white">상품 등록</h1>
        <p className="text-sm text-slate-500">신규 상품 정보·역할별 수당·규정을 등록합니다.</p>
      </div>
      <ProductForm mode="new" />
    </div>
  );
}
