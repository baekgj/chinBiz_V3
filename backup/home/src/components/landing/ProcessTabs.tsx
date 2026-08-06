"use client";

import { useState } from "react";

type Row = { no: string; name: string; task: string; ui: string };
type Track = { key: string; tab: string; concept: string; rows: Row[] };

const TRACKS: Track[] = [
  {
    key: "buzz", tab: "버즈회원 절차",
    concept: "어려운 시공과 관리는 매니저가! 버즈는 '소개'와 '리드 접수'에만 집중",
    rows: [
      { no: "01", name: "가망고객 발굴", task: "일상 네트워크, 상가, 기업에서 필요한 서비스/제품 니즈 파악", ui: "상품 둘러보기 / 영업 카탈로그" },
      { no: "02", name: "리드 접수", task: "가망고객 기본 정보(성함, 연락처, 매장/기업명, 문의사항) 앱 입력", ui: "[리드 접수하기] 간편 폼" },
      { no: "03", name: "진행 현황 트래킹", task: "배정된 매니저의 현장 미팅 일정 및 계약 진행 상태 실시간 확인", ui: "[내 리드 현황] 대시보드 · 알림톡 자동 수신" },
      { no: "04", name: "수당 확정 & 수령", task: "매니저의 계약 완료 및 고객의 정기 결제 확인 후 수당(CP/MP) 확인", ui: "[예정/확정 수당 원장] · 원클릭 출금 신청" },
    ],
  },
  {
    key: "manager", tab: "관리매니저 절차",
    concept: "골든타임을 지키는 현장 대응력! 실사부터 시공, 전자계약 완결까지",
    rows: [
      { no: "01", name: "리드 콜 수락", task: "3단계 스케줄러를 통해 할당된 지역 영업 리드 알림 수락 (매칭)", ui: "[신규 리드 수락/거절] 앱 푸시" },
      { no: "02", name: "현장 방문 & 실사", task: "고객 매장/기업 방문, 시공/설치 가능 여부(배관, 전기, 통신 등) 검토", ui: "현장 실사 체크리스트 작성" },
      { no: "03", name: "전자계약 체결", task: "상품 계약서 작성 및 정기 결제(CMS/카드) 수단 등록", ui: "친비즈 전자계약(모바일 서명)" },
      { no: "04", name: "시공/온보딩 완료", task: "제품 설치 완료 사진 업로드 및 고객 사용 교육 후 최종 완료 처리", ui: "[완료 보고서 제출] (사진 첨부)" },
    ],
  },
  {
    key: "partner", tab: "파트너사 절차",
    concept: "영업망 확장부터 자동 주문·배송 및 출금 결과 연동까지",
    rows: [
      { no: "01", name: "상품 등록 / 입점", task: "공급할 상품 정보, 표준 공급가, CP/MP 수당율 설정 및 입점 승인", ui: "파트너 어드민 [상품 등록]" },
      { no: "02", name: "주문 / 계약 접수", task: "매니저가 현장에서 등록한 계약 정보 및 이행 요청 확인", ui: "[실시간 주문/계약 관제]" },
      { no: "03", name: "제품 물류 & 공급", task: "하드웨어 출고/택배 발송 또는 전문 엔지니어 2차 지원", ui: "운송장/출고 정보 입력" },
      { no: "04", name: "CMS 출금 결과 연동", task: "매월 고객의 전산비/구독료 자동이체 결과를 API 또는 엑셀로 전송", ui: "CMS 웹훅 API / 엑셀 업로드 파서" },
    ],
  },
];

export default function ProcessTabs() {
  const [active, setActive] = useState("buzz");
  const t = TRACKS.find((x) => x.key === active)!;

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {TRACKS.map((x) => (
          <button key={x.key} onClick={() => setActive(x.key)}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${active === x.key ? "bg-forest-800 text-white shadow" : "bg-surface-3 text-ink-soft hover:bg-surface-2"}`}>
            {x.tab}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-forest-950 px-6 py-5">
        <p className="text-xs font-bold text-gold-300">핵심 콘셉트</p>
        <p className="mt-1 text-lg font-black text-white">&ldquo;{t.concept}&rdquo;</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="px-5 py-4 text-left font-semibold">단계</th>
              <th className="px-5 py-4 text-left font-semibold">프로세스 명</th>
              <th className="px-5 py-4 text-left font-semibold">주요 업무</th>
              <th className="px-5 py-4 text-left font-semibold">사용 UI / 앱 기능</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {t.rows.map((r) => (
              <tr key={r.no} className="hover:bg-surface-2">
                <td className="px-5 py-4 text-lg font-black text-gold-500">{r.no}</td>
                <td className="px-5 py-4 font-bold text-ink">{r.name}</td>
                <td className="px-5 py-4 text-muted">{r.task}</td>
                <td className="px-5 py-4"><span className="inline-block rounded-lg bg-gold-50 px-3 py-1.5 text-xs font-semibold text-ink-soft ring-1 ring-gold-400/30">✓ {r.ui}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
