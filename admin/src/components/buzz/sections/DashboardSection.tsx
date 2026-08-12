"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { krw } from "@/components/ui";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet, mediaUrl } from "@/lib/api";
import { myReward } from "@/lib/reward";

type Dash = { cp: number; mp: number; confirmedMp: number; cumulativeMp: number };
type Summary = {
  stages: Record<string, number>;
  recentMessage: string | null;
  referredCount: number;
  networkIncome: number;
  referralCode: string;
};
type Product = { id: number; name: string; salePrice: number; totalAllowance: number; rewardType?: string; buzzReward?: number; managerReward?: number; image1?: string; partnerName?: string; categoryName?: string };
type Notice = { id: number; title: string; createdAt: string };

const STAGE_ORDER = ["리드접수", "매니저실사", "계약대기", "최종성공", "정산완료"];

// [친비즈 주요 용어] (docs/21 Task5)
const TERMS: { term: string; desc: string }[] = [
  { term: "영업 파이프라인", desc: "가망고객(리드) 추천부터 현장실사, 계약, 시공, 정산까지 거래가 진행되는 전체 단계와 상태를 한눈에 보여주는 현장 관제 시스템입니다." },
  { term: "상품 마켓", desc: "버즈회원이 주변 사장님이나 매장에 추천하여 CP/MRA 수익을 창출할 수 있는 검증된 B2B 상품/서비스 모음입니다." },
  { term: "CP (예상수당)", desc: "리드 접수 및 계약 진행 시 발생하여 적립되는 ‘지급 예정 포인트’입니다. (파트너사 결제 완료 시 MP로 승격)" },
  { term: "MP (확정수당)", desc: "최종 정산 완료되어 내 계좌로 현금 지급이 가능한 확정 포인트입니다." },
  { term: "마감/정산", desc: "매월 1일부터 말일까지 MP를 마감/정산하여 버즈회원이 지정한 계좌로 익월 15일에 지급합니다. (상품에 따라 지급일이 다를 수 있습니다)" },
  { term: "OTA (One Time Allowance)", desc: "단 1회 유치 성공 시 일시불로 크게 지급되는 단발성 수수료입니다." },
  { term: "MRA (Monthly Recurring Allowance)", desc: "유치한 매장이 입점/렌탈을 유지하는 동안 매월 지속 지급되는 연금형 수수료입니다." },
];

/** 버즈 대시보드 (docs/21) — 환영·수당요약 / 파이프라인 / 상품마켓 / 네트워크 / 공지 + 주요용어 팝업 */
export default function DashboardSection() {
  const { theme, name } = useBuzz();
  const [dash, setDash] = useState<Dash>({ cp: 0, mp: 0, confirmedMp: 0, cumulativeMp: 0 });
  const [sum, setSum] = useState<Summary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [termsOpen, setTermsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Dash>("/api/buzz/dashboard?as=buzz").then((r) => { if (r.data) setDash(r.data); });
    apiGet<Summary>("/api/buzz/dashboard/summary").then((r) => { if (r.data) setSum(r.data); });
    apiGet<{ content: Product[] }>("/api/buzz/products?page=0&size=6").then((r) => { if (r.data) setProducts(r.data.content ?? []); });
    apiGet<{ content: Notice[] }>("/api/my/notices?page=0&size=2&as=buzz").then((r) => { if (r.data) setNotices(r.data.content ?? []); });
  }, []);

  const refUrl = `https://chinbiz.kr/signup?ref=${sum?.referralCode ?? ""}`;
  async function copyRef() {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(refUrl);
      else { const t = document.createElement("textarea"); t.value = refUrl; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
      setToast("추천 링크가 복사되었습니다. 카카오톡이나 SNS에 공유하세요!");
    } catch { setToast("복사에 실패했습니다. 링크를 길게 눌러 복사해 주세요."); }
    setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="space-y-5">
      {/* 1. 환영 / 수당 요약 헤더 (흰색 배경, docs) */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-black text-slate-900">🙋 {name ? `${name}님` : "버즈님"}, 반갑습니다!</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              이번 달 예정 수당 <b className="text-emerald-700">{krw(dash.cp)}</b> · 확정 수당 <b className="text-emerald-700">{krw(dash.confirmedMp)}</b> 을 적립 중입니다!
            </p>
          </div>
          <button onClick={() => setTermsOpen(true)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${theme.primaryBtn}`}>
            친비즈 주요 용어 보기 &gt;
          </button>
        </div>
      </div>

      {/* 수당 요약 카드 (출금 가능 MP / 이번 달 예정 CP) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/buzz/allowances" className={`block rounded-2xl p-5 shadow-sm transition-transform hover:-translate-y-0.5 ${theme.mpCard}`}>
          <p className="text-xs font-bold">출금 가능 수당 (MP)</p>
          <p className="mt-2 text-3xl font-black">{krw(dash.cumulativeMp)}</p>
          <p className="mt-2 text-xs font-semibold opacity-90">확정 금액 · [수당현황 / 정산현황]에서 확인 &gt;</p>
        </Link>
        <div className={`rounded-2xl p-5 shadow-sm ${theme.cpCard}`}>
          <p className={`text-xs font-semibold ${theme.cpLabel}`}>이번 달 예정 수당 (CP)</p>
          <p className="mt-2 text-3xl font-black">{krw(dash.cp)}</p>
          <p className={`mt-1 text-xs ${theme.cpLabel}`}>실사/계약 진행 중 · 곧 정산될 예상 금액</p>
        </div>
      </div>

      {/* 2. 영업 파이프라인 현황 */}
      <Card title="영업 파이프라인 현황" sub="가망고객이 계약까지 가면서 거치는 거래의 상태와 진행 단계"
        right={<Link href="/buzz/pipeline" className={`text-sm font-bold ${theme.accent}`}>상세보기 &gt;</Link>}>
        <div className="flex flex-wrap items-stretch gap-2">
          {STAGE_ORDER.map((label, i) => (
            <div key={label} className="flex items-stretch gap-2">
              <Link href="/buzz/pipeline" className={`flex min-w-[92px] flex-col items-center justify-center rounded-xl border px-3 py-3 transition-transform hover:-translate-y-0.5 ${theme.tableWrap}`}>
                <span className={`text-xs font-semibold ${theme.cellSub}`}>{label}</span>
                <span className={`mt-1 text-2xl font-black ${theme.cellMain}`}>{sum?.stages?.[label] ?? 0}<span className="text-xs font-semibold">건</span></span>
              </Link>
              {i < STAGE_ORDER.length - 1 && <span className={`self-center text-lg ${theme.cellSub}`}>→</span>}
            </div>
          ))}
        </div>
        {sum?.recentMessage && (
          <p className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${theme.chipBox}`}>
            <span className="text-red-500">●</span> [실시간 진행] {sum.recentMessage}
          </p>
        )}
      </Card>

      {/* 3. 상품 마켓 (2×3 그리드) */}
      <Card title="추천 가능 상품 마켓" sub="파이프라인에서 거래될 검증된 제품과 타겟 고객이 존재하는 기반"
        right={<Link href="/buzz/market" className={`text-sm font-bold ${theme.accent}`}>전체보기 &gt;</Link>}>
        {products.length === 0 ? (
          <p className={`py-8 text-center text-sm ${theme.note}`}>등록된 상품이 없습니다.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/buzz/market/${p.id}`} className={`flex gap-3 rounded-xl border p-3 transition-transform hover:-translate-y-0.5 ${theme.tableWrap}`}>
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-black/5">
                  {p.image1 ? <img src={mediaUrl(p.image1)} alt={p.name} className="h-full w-full object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-bold ${theme.cellMain}`}>{p.name}</span>
                  <span className={`block truncate text-xs ${theme.cellSub}`}>🎯 {p.categoryName ?? p.partnerName ?? "-"}</span>
                  <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-bold ${theme.goldBadge}`}>내 수당 {krw(myReward(p, false))}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* 4. 버즈네트워크 구축하기 */}
      <Card title="버즈네트워크 구축하기" sub="하위 버즈 모집으로 패시브 인컴 생성"
        right={<Link href="/buzz/network" className={`text-sm font-bold ${theme.accent}`}>자세히 &gt;</Link>}>
        <p className={`text-sm font-bold ${theme.cellMain}`}>“추천된 버즈 수익의 약 <span className={theme.accent}>10%</span>를 MP로 적립받습니다.”</p>
        <div className={`mt-3 rounded-xl border p-4 ${theme.tableWrap}`}>
          <p className={`text-xs ${theme.cellSub}`}>내 추천 코드</p>
          <p className={`font-mono text-sm font-bold ${theme.cellMain}`}>{sum?.referralCode ?? "-"}</p>
          <p className={`mt-2 break-all text-xs ${theme.cellSub}`}>{refUrl}</p>
          <button onClick={copyRef} className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-bold ${theme.primaryBtn}`}>
            🔗 추천링크 복사하여 공유
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className={`rounded-xl border p-3 text-center ${theme.tableWrap}`}>
            <p className={`text-xs ${theme.cellSub}`}>내가 추천한 버즈</p>
            <p className={`text-xl font-black ${theme.cellMain}`}>{sum?.referredCount ?? 0}명</p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${theme.tableWrap}`}>
            <p className={`text-xs ${theme.cellSub}`}>네트워크 발생 수익</p>
            <p className={`text-xl font-black ${theme.statTone.gold}`}>{krw(sum?.networkIncome ?? 0)}</p>
          </div>
        </div>
      </Card>

      {/* 5. 공지사항 & 혜택 알림 */}
      <Card title="공지사항 & 혜택 알림" sub="프로모션 이벤트 및 정산일 안내"
        right={<Link href="/buzz/notices" className={`text-sm font-bold ${theme.accent}`}>더보기 &gt;</Link>}>
        {notices.length === 0 ? (
          <p className={`py-6 text-center text-sm ${theme.note}`}>등록된 공지사항이 없습니다.</p>
        ) : (
          <ul className={`divide-y ${theme.divide}`}>
            {notices.slice(0, 2).map((n) => (
              <li key={n.id}>
                <Link href="/buzz/notices" className={`flex items-center justify-between gap-3 py-3 ${theme.rowHover}`}>
                  <span className={`truncate text-sm font-semibold ${theme.cellMain}`}>{n.title}</span>
                  <span className={`shrink-0 text-xs ${theme.cellSub}`}>{(n.createdAt ?? "").slice(0, 10)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 복사 토스트 */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90%] rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          {toast}
        </div>
      )}

      {/* 주요 용어 팝업 (docs/21 Task5) — document.body 로 portal 하여 뷰포트 정중앙 고정
          (대시보드 래퍼의 animate-float-up transform 이 containing block 이 되어 화면 중앙을 벗어나는 문제 방지) */}
      {termsOpen && createPortal(
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onClick={() => setTermsOpen(false)}>
          <div className={`max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl ${theme.card}`} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`text-lg font-black ${theme.cardHead}`}>친비즈 주요 용어</h3>
              <button onClick={() => setTermsOpen(false)} className={`text-sm ${theme.cellSub} hover:opacity-70`} aria-label="닫기">✕</button>
            </div>
            <p className={`mb-4 text-xs ${theme.cardSub}`}>버즈회원의 원활한 활동을 위한 친비즈 주요 용어 정의입니다.</p>
            <ul className="space-y-3">
              {TERMS.map((t) => (
                <li key={t.term} className={`rounded-xl border p-3.5 ${theme.tableWrap}`}>
                  <p className={`text-sm font-black ${theme.cellMain}`}>{t.term}</p>
                  <p className={`mt-1 text-sm leading-relaxed ${theme.cellSub}`}>{t.desc}</p>
                </li>
              ))}
            </ul>
            <button onClick={() => setTermsOpen(false)} className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-bold ${theme.primaryBtn}`}>확인</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
