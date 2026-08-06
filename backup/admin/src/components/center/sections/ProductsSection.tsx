"use client";

import { useState } from "react";
import { Card, Stat, ct } from "@/components/center/CenterUI";

type Prod = { cat: string; name: string; partner: string; code: string; on: boolean };
const INIT: Prod[] = [
  { cat: "디지털", name: "매장 자동화 AI 청기 시스템", partner: "테크노플러스", code: "PROD_AI_01", on: true },
  { cat: "푸드테크", name: "프리미엄 K-중식 식자재 패키지", partner: "한식마켓", code: "PROD_K_FOOD", on: false },
  { cat: "상권활성화", name: "명동 스마트 상점 솔루션", partner: "스마트리테일", code: "PROD_SMART_SHOP", on: true },
  { cat: "뷰티", name: "뷰티샵 예약/결제 통합 시스템", partner: "뷰티테크", code: "PROD_BEAUTY", on: false },
];

export default function ProductsSection() {
  const [prods, setProds] = useState<Prod[]>(INIT);
  const onCount = prods.filter((p) => p.on).length;
  const toggle = (code: string) => setProds((ps) => ps.map((p) => (p.code === code ? { ...p, on: !p.on } : p)));

  return (
    <div className="space-y-5">
      {/* 상품 소싱 / 취급 관리 */}
      <Card
        title="상품 소싱 / 취급 관리"
        sub="센터 취급 여부에 따라 교육·관리·수당 정산 권한이 자동으로 본사 또는 연합 인프라로 우회"
        right={<button className={`rounded-lg px-3 py-2 text-xs font-bold ${ct.outlineBtn}`}>라우팅 룰 테이블 보기</button>}
      >
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Stat label="전체 상품" value={String(prods.length)} tone="slate" />
          <Stat label="취급 중 (ON)" value={String(onCount)} tone="emerald" />
          <Stat label="본사 우회 (OFF)" value={String(prods.length - onCount)} tone="amber" />
        </div>
        <div className="space-y-2">
          {prods.map((p) => (
            <div key={p.code} className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${ct.tableWrap}`}>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ct.badge}`}>{p.cat}</span>
                  {p.on
                    ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">센터 취급 중</span>
                    : <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">본사 직할 / 연합 지원 상품</span>}
                </div>
                <p className={`font-bold ${ct.cellMain}`}>{p.name}</p>
                <p className={`text-xs ${ct.cellSub}`}>{p.partner} · ID: {p.code}</p>
                {!p.on && <p className={`mt-1 text-[11px] ${ct.note}`}>교육: HQ_ACADEMY (본사) | 수당: HQ_MAIN (본사 수취)</p>}
              </div>
              <button onClick={() => toggle(p.code)} aria-label="취급 토글"
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${p.on ? "bg-amber-400" : "bg-amber-900/40"}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${p.on ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
        <p className={`mt-3 text-xs ${ct.note}`}>※ OFF(관심없음) 상품도 버즈·매니저 영업은 중단 없이 본사 우회로 실행됩니다(CLAUDE.md §7).</p>
      </Card>

      {/* 버즈 교육 컨트롤 */}
      <Card title="소속 버즈회원 컨트롤 패널: 상품 안내 및 교육" sub="1차 영업 활성화 가이드 제공 및 교육 세션 운영">
        <div className={`mb-4 rounded-xl border p-4 ${ct.tableWrap}`}>
          <p className={`text-xs font-bold ${ct.statTone.gold}`}>이번 주 추천 상품 공지</p>
          <p className={`mt-1 text-sm ${ct.cellMain}`}><b>[AI 청기 시스템]</b>의 센터 소속 수당 프로모션이 진행됩니다. 소속 버즈회원 대시보드 상단 노출 설정.</p>
          <button className={`mt-3 rounded-lg px-4 py-2 text-xs font-bold ${ct.primaryBtn}`}>전체 버즈회원 화면에 상품 추천 등록</button>
        </div>
        <div className={`rounded-xl border p-4 ${ct.tableWrap}`}>
          <p className={`text-sm font-bold ${ct.cellMain}`}>버즈회원 기본/심화 교육 스케줄러</p>
          <p className={`mt-1 text-xs ${ct.cellSub}`}>링크 전달법 및 1차 타겟 스피치 가이드 · 2026-07-08 14:00 · 온라인 라이브(줌) · 수강신청 185명</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={`rounded-lg px-3 py-2 text-xs font-bold ${ct.outlineBtn}`}>교육 줌 링크 생성·푸시 발송</button>
            <button className={`rounded-lg border px-3 py-2 text-xs font-semibold ${ct.tableWrap} ${ct.cellSub}`}>수강신청 현황 상세</button>
          </div>
        </div>
      </Card>

      {/* 매니저 교육 컨트롤 */}
      <Card title="소속 관리매니저 컨트롤 패널: 전문 교육 안내" sub="현장 실사·설치·민원 처리 매니저 전문성 향상 및 업무 절차 관리">
        <div className={`mb-4 rounded-xl border p-4 ${ct.tableWrap}`}>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">신규 입점</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ct.badge}`}>설치상품</span>
          </div>
          <p className={`text-sm font-bold ${ct.cellMain}`}>AI 청기 시스템 기술 규격서</p>
          <p className={`mt-1 text-xs ${ct.cellSub}`}>신규 입점 설치상품의 기술 규격서 및 현장 체크리스트 표준안 공지</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={`rounded-lg px-3 py-2 text-xs font-bold ${ct.outlineBtn}`}>기술 규격서 (PDF)</button>
            <button className={`rounded-lg px-3 py-2 text-xs font-bold ${ct.outlineBtn}`}>현장 체크리스트 표준안 (PDF)</button>
          </div>
        </div>
        <div className={`rounded-xl border p-4 ${ct.tableWrap}`}>
          <p className={`text-sm font-bold ${ct.cellMain}`}>오프라인 기술/상담 교육 세션</p>
          <p className={`mt-1 text-xs ${ct.cellSub}`}>하드웨어 현장 세팅·반품 역정산 프로세스 · 2026-07-10 10:00 · 강남 제1센터 대강의실</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className={`rounded-lg px-3 py-2 text-xs font-bold ${ct.primaryBtn}`}>매니저 출석 QR 코드 생성</button>
            <span className={`text-xs ${ct.note}`}>필수 미이수 시 배정 제한</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
