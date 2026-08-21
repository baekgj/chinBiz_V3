"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { dv, Card } from "@/components/division/DivisionUI";
import WalletSection from "@/components/division/sections/WalletSection";
import CentersSection from "@/components/division/sections/CentersSection";

type Me = { name?: string; salesCenterName?: string | null };

/** 본부분석 대시보드 (docs/24) — 헤더 + 광역 오버라이딩 수수료(실데이터) + 산하 센터별 실적비교(실데이터) + 관제 패널 */
export default function DivisionDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { apiGet<Me>("/api/user/me").then((r) => { if (r.data) setMe(r.data); }); }, []);
  const region = me?.salesCenterName ?? "광역 관할";

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className={dv.card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-lg font-black ${dv.brand}`}>🏛️ [{region} 광역본부] 상품 통합 관제 대시보드</p>
            <p className={`mt-1 text-sm ${dv.cardSub}`}>관할 영역: <b className={dv.accent}>{region}</b></p>
          </div>
          <Link href="/division/profile" className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${dv.outlineBtn}`}>MY 프로필 &gt;</Link>
        </div>
      </div>

      {/* 본부 광역 오버라이딩 수수료 & 종합 성과 (실데이터) */}
      <WalletSection />

      {/* 산하 센터별 상품 이행 및 실적 비교 (실데이터) */}
      <CentersSection />

      {/* 광역 프로모션 기획 (전용 메뉴 연동) */}
      <Card title="광역 프로모션 기획 & 설정" sub="본부 예산 기반 산하 센터·버즈 프로모션"
        right={<Link href="/division/promotion" className={`text-sm font-bold ${dv.accent}`}>광역프로모션 &gt;</Link>}>
        <p className={`py-8 text-center text-sm ${dv.note}`}>광역 프로모션 기획 화면은 [광역프로모션] 메뉴에서 제공될 예정입니다.</p>
      </Card>

      {/* 광역 리드 이관 지원 (신규 집계 엔드포인트 연동 예정) */}
      <Card title="광역 리드 이관 지원" sub="센터 간 미배정 리드 조정">
        <p className={`py-8 text-center text-sm ${dv.note}`}>센터 간 리드 이관 지원 데이터 연동은 준비 중입니다.</p>
      </Card>
    </div>
  );
}
