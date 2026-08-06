"use client";

import { PageHead } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";

/** 상품/관리 마켓 헤더 — 뷰(버즈/매니저)에 따라 타이틀·문구 전환 */
export default function MarketHead() {
  const { isManager } = useBuzz();
  return isManager ? (
    <PageHead title="관리마켓" sub="교육이수 및 2차영업 가능 상품" />
  ) : (
    <PageHead title="상품 마켓" sub="1차 영업 대상 상품 · 추천 링크 공유" />
  );
}
