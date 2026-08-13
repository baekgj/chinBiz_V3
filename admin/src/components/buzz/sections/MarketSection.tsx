"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { krw } from "@/components/ui";
import { Card, GoldBadge } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet, apiPost, mediaUrl } from "@/lib/api";
import { myReward } from "@/lib/reward";
import { computeDday, canApplySale } from "@/lib/dday";

type Item = { id: number; name: string; salePrice: number; totalAllowance: number; rewardType?: string; buzzReward?: number; managerReward?: number; image1?: string; partnerName?: string; categoryName?: string; categoryId?: number | null; contractEndDate?: string | null; popular?: boolean; recommended?: boolean; autoAssign?: boolean };
type PageResp = { content: Item[]; page: number; totalPages: number; totalElements: number };
const SIZE = 9; // 3 x 3

/** 상품 마켓 — 3x3 그리드, 검색(상품명/파트너/카테고리), 페이징, 상품명 클릭→상세 */
export default function MarketSection() {
  const { theme, isManager } = useBuzz();
  const [rows, setRows] = useState<Item[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // 검색 입력 + 적용 (상품명만 — docs/22: 카테고리·파트너사 필터 제거)
  const [kw, setKw] = useState("");
  const [q, setQ] = useState({ kw: "" });

  const reqRef = useRef(0);
  const load = useCallback(async (p: number) => {
    const myReq = ++reqRef.current; // 최신 요청만 반영(뷰 전환/페이징 경합 방지)
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), size: String(SIZE) });
    if (q.kw) params.set("keyword", q.kw);
    if (isManager) params.set("as", "manager"); // 관리마켓: 교육이수 완료 상품만 + autoAssign
    const r = await apiGet<PageResp>(`/api/buzz/products?${params}`);
    if (myReq !== reqRef.current) return; // 뒤늦게 도착한 이전 요청 응답 무시
    if (r.data) { setRows(r.data.content); setTotalPages(r.data.totalPages || 1); setTotal(r.data.totalElements); setPage(r.data.page); }
    setLoading(false);
  }, [q, isManager]);

  useEffect(() => { load(0); }, [load]);

  // 자동배정 동의/미동의 실시간 토글
  async function toggleAutoAssign(id: number, next: boolean) {
    setRows((rs) => rs.map((it) => (it.id === id ? { ...it, autoAssign: next } : it))); // 낙관적 업데이트
    const r = await apiPost<{ autoAssign: boolean }>(`/api/buzz/products/${id}/auto-assign`, { autoAssign: next });
    if (!r.ok) setRows((rs) => rs.map((it) => (it.id === id ? { ...it, autoAssign: !next } : it))); // 실패 시 롤백
  }

  const inputCls = `rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-slate-400 ${theme.input}`;

  return (
    <Card title={isManager ? undefined : "상품 마켓"} sub={isManager ? undefined : `총 ${total}개 · 1차 영업 대상 상품`}>
      {/* 검색 (상품명만) — 리스트와 간격 + 경계선 (docs/21·22) */}
      <div className={`mb-6 flex flex-wrap items-end gap-2 border-b pb-5 ${theme.tableWrap}`}>
        <div>
          <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>상품명</p>
          <input className={inputCls} value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setQ({ kw })} placeholder="상품명" />
        </div>
        <button onClick={() => setQ({ kw })} className={`rounded-lg px-4 py-2 text-sm font-bold ${theme.primaryBtn}`}>검색</button>
        <button onClick={() => { setKw(""); setQ({ kw: "" }); }} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${theme.tableWrap} ${theme.cellSub}`}>초기화</button>
      </div>

      {loading ? (
        <p className={`py-10 text-center text-sm ${theme.note}`}>불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className={`py-10 text-center text-sm ${theme.note}`}>상품이 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((it) => {
            const dd = computeDday(it.contractEndDate);
            return (
            <div key={it.id} className={`flex flex-col overflow-hidden rounded-xl border ${theme.tableWrap}`}>
              <div className="relative">
                {it.image1
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={mediaUrl(it.image1)} alt={it.name} className="h-32 w-full object-cover" />
                  : <div className={`grid h-32 w-full place-items-center text-xs ${theme.note} ${isManager ? "bg-neutral-800" : "bg-emerald-50"}`}>이미지 없음</div>}
                {/* 계약종료일 등록 상품: 이미지 우상단 D-day 배지 */}
                {dd && (
                  <span className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-xs font-black shadow ${dd.closingSoon || dd.expired ? "bg-red-600 text-white" : "bg-black/75 text-amber-300"}`}>
                    {dd.label}
                  </span>
                )}
                {/* 키워드 배지: 이미지 좌상단 (인기/추천) */}
                {(it.popular || it.recommended) && (
                  <div className="absolute left-2 top-2 flex gap-1">
                    {it.popular && <span className="rounded-md bg-amber-500 px-2 py-0.5 text-xs font-black text-white shadow">인기</span>}
                    {it.recommended && <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-black text-white shadow">추천</span>}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <Link href={`/buzz/market/${it.id}`} className={`font-black hover:underline ${theme.cardHead}`}>{it.name}</Link>
                </div>
                {/* 마감 7일 미만: 상품명 하단 붉은 안내 */}
                {dd?.closingSoon && <p className="mb-1 text-xs font-bold text-red-500">[{dd.message}]</p>}
                <p className={`text-xs ${theme.cardSub}`}>{it.partnerName ?? "-"}{it.categoryName ? ` · ${it.categoryName}` : ""}</p>
                <div className="mt-3 flex items-end justify-between">
                  <span className={`text-sm ${theme.cellSub}`}>{krw(it.salePrice)}</span>
                  <GoldBadge>내 수당 {krw(myReward(it, isManager))}</GoldBadge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/buzz/market/${it.id}`} className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-bold ${(!isManager && canApplySale(it.contractEndDate)) || isManager ? theme.outlineBtn : theme.primaryBtn}`}>상세 보기</Link>
                  {/* 버즈 뷰 + 7일 이상 남은 상품: 1차영업신청 (카테고리·상품 자동선택) */}
                  {!isManager && canApplySale(it.contractEndDate) && (
                    <Link href={`/buzz/pipeline/new?productId=${it.id}${it.categoryId ? `&categoryId=${it.categoryId}` : ""}`}
                      className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-bold ${theme.primaryBtn}`}>1차영업신청</Link>
                  )}
                  {/* 매니저 뷰: 자동배정 동의여부 토글 스위치 (클릭 시 즉시 저장) */}
                  {isManager && (
                    <div className="flex shrink-0 items-center gap-2" title="자동배정 동의여부 (클릭 시 즉시 저장)">
                      <span className="text-[11px] font-semibold text-neutral-300">자동배정</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!it.autoAssign}
                        aria-label="자동배정 동의여부"
                        onClick={() => toggleAutoAssign(it.id, !it.autoAssign)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${it.autoAssign ? "bg-blue-500" : "bg-neutral-600"}`}>
                        <span
                          className="absolute top-0.5 left-0 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                          style={{ transform: it.autoAssign ? "translateX(22px)" : "translateX(2px)" }}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );})}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1">
          <button disabled={page <= 0} onClick={() => load(page - 1)} className={`rounded-lg border px-3 py-1.5 text-sm ${theme.tableWrap} ${theme.cellSub} disabled:opacity-40`}>이전</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => load(i)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i === page ? theme.primaryBtn : `border ${theme.tableWrap} ${theme.cellSub}`}`}>{i + 1}</button>
          ))}
          <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} className={`rounded-lg border px-3 py-1.5 text-sm ${theme.tableWrap} ${theme.cellSub} disabled:opacity-40`}>다음</button>
        </div>
      )}
    </Card>
  );
}
