"use client";

import { Fragment, useEffect, useState } from "react";
import { Card, Stat, dv } from "@/components/division/DivisionUI";
import { krw } from "@/components/ui";
import { apiGet } from "@/lib/api";

/**
 * 센터별 실적비교 (docs/35-1) — 월 검색(기본=이번달)
 *  - 해당월 산하 현황(센터수/버즈회원수/상품종류) + 산하 센터별 리스트
 *  - [센터코드·센터명] 클릭 → 해당 센터의 [1차 영업 상품별 센터/버즈 매핑 현황] 펼침 (한 번에 1개 센터만)
 *  BE: GET /api/division/centers?month=, GET /api/division/centers/{idx}/products?month=
 */

type CenterRow = {
  idx: number; centerCode: string; centerName: string; headUserId: string | null; headName: string | null;
  buzzCount: number; managerCount: number; saleCount: number; divisionReward: number;
};
type Summary = { month: string; centerCount: number; buzzCount: number; productKinds: number; centers: CenterRow[] };
type ProductRow = {
  productId: number; productName: string; partnerName: string | null; buzzCount: number; saleCount: number;
  rewardPerCase: number; rewardRate: number | null;
};

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const n = (v?: number) => (v ?? 0).toLocaleString("ko-KR");

export default function CentersSection() {
  const [monthInput, setMonthInput] = useState(thisMonth);
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [products, setProducts] = useState<ProductRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setOpenIdx(null); setProducts(null);
    apiGet<Summary>(`/api/division/centers?month=${month}`).then((r) => {
      if (!alive) return;
      setData(r.ok && r.data ? r.data : null);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [month]);

  async function toggle(idx: number) {
    if (openIdx === idx) { setOpenIdx(null); setProducts(null); return; }
    setOpenIdx(idx); setProducts(null);
    const r = await apiGet<{ products: ProductRow[] }>(`/api/division/centers/${idx}/products?month=${month}`);
    setProducts(r.ok && r.data ? r.data.products : []);
  }

  const [y, m] = month.split("-");
  const total = data?.centers.reduce((acc, c) => ({ sale: acc.sale + c.saleCount, reward: acc.reward + c.divisionReward }), { sale: 0, reward: 0 });

  return (
    <div className="space-y-5">
      {/* 헤더 + 월 검색 (오른쪽 상단) */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-xl font-black ${dv.h1}`}>산하 센터별 1차 영업(버즈) 모니터링</h1>
          <p className={`mt-0.5 text-sm ${dv.h1Sub}`}>산하 센터들의 마케팅/리쿠르팅 볼륨과 1차 영업 상품 집중도 분석</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={monthInput} onChange={(e) => setMonthInput(e.target.value)}
            className={`rounded-lg border px-3 py-2 text-sm outline-none [color-scheme:dark] ${dv.input}`} />
          <button onClick={() => monthInput && setMonth(monthInput)} className={`rounded-lg px-4 py-2 text-sm font-bold ${dv.primaryBtn}`}>월 검색</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="본부 산하 총 센터 수" value={n(data?.centerCount)} unit="개 센터" tone="violet" />
        <Stat label="본부 산하 총 소속 버즈회원 수" value={n(data?.buzzCount)} unit="명" tone="fuchsia" />
        <Stat label="진행 중인 1차 영업 상품 종류 수" value={n(data?.productKinds)} unit="종" tone="slate" />
      </div>

      <Card title={`산하 센터별 실적 (${y}년 ${Number(m)}월)`} sub="센터코드·센터명을 클릭하면 1차 영업 상품별 센터/버즈 매핑 현황을 볼 수 있습니다.">
        <div className={`overflow-x-auto rounded-xl border ${dv.tableWrap}`}>
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className={`text-xs ${dv.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">센터코드</th>
                <th className="px-4 py-3 text-left font-semibold">센터명</th>
                <th className="px-4 py-3 text-left font-semibold">센터장ID</th>
                <th className="px-4 py-3 text-left font-semibold">센터장명</th>
                <th className="px-4 py-3 text-right font-semibold">버즈수</th>
                <th className="px-4 py-3 text-right font-semibold">매니저수</th>
                <th className="px-4 py-3 text-right font-semibold">영업접수건수</th>
                <th className="px-4 py-3 text-right font-semibold">본부배정 수당</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dv.divide}`}>
              {loading && <tr><td colSpan={8} className={`px-4 py-8 text-center ${dv.note}`}>불러오는 중…</td></tr>}
              {!loading && (!data || data.centers.length === 0) && (
                <tr><td colSpan={8} className={`px-4 py-8 text-center ${dv.note}`}>산하 센터가 없습니다.</td></tr>
              )}
              {!loading && data?.centers.map((c) => {
                const open = openIdx === c.idx;
                return (
                  <Fragment key={c.idx}>
                    <tr className={open ? "bg-violet-900/30" : dv.rowHover}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggle(c.idx)} className={`font-semibold underline-offset-2 hover:underline ${dv.accent}`}>{c.centerCode}</button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggle(c.idx)} className={`font-bold underline-offset-2 hover:underline ${dv.cellMain}`}>
                          {c.centerName} <span className={`text-xs ${dv.cellSub}`}>{open ? "▲" : "▼"}</span>
                        </button>
                      </td>
                      <td className={`px-4 py-3 ${c.headUserId ? dv.cellMain : dv.note}`}>{c.headUserId ?? "[미등록]"}</td>
                      <td className={`px-4 py-3 ${c.headName ? dv.cellMain : dv.note}`}>{c.headName ?? "[미등록]"}</td>
                      <td className={`px-4 py-3 text-right ${dv.cellSub}`}>{n(c.buzzCount)} 명</td>
                      <td className={`px-4 py-3 text-right ${dv.cellSub}`}>{n(c.managerCount)} 명</td>
                      <td className={`px-4 py-3 text-right font-semibold ${dv.cellMain}`}>{n(c.saleCount)} 건</td>
                      <td className={`px-4 py-3 text-right font-black ${dv.statTone.fuchsia}`}>{krw(c.divisionReward)}</td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={8} className="bg-[#171225] px-4 py-4">
                          <ProductMapping centerName={c.centerName} rows={products} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            {!loading && data && data.centers.length > 0 && total && (
              <tfoot>
                <tr className={`border-t ${dv.tableWrap} ${dv.thead}`}>
                  <td colSpan={6} className="px-4 py-3 text-right text-xs font-bold">합계</td>
                  <td className={`px-4 py-3 text-right font-bold ${dv.cellMain}`}>{n(total.sale)} 건</td>
                  <td className={`px-4 py-3 text-right font-black ${dv.statTone.fuchsia}`}>{krw(total.reward)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <p className={`mt-3 text-xs ${dv.note}`}>
          ※ 버즈수: 해당월 말 기준 소속 버즈회원 · 매니저수: 해당월 말까지 활동센터 승인 매니저 · 영업접수건수: 해당월 1차영업 접수(소속 회원 등록 기준) ·
          본부배정 수당: 해당월 발생한 본부 수당 전표 순액(취소 차감 포함)
        </p>
      </Card>
    </div>
  );
}

/** [1차 영업 상품별 센터/버즈 매핑 현황] — 선택 센터·해당월 (활성 센터 수 컬럼 삭제, docs/35-1) */
function ProductMapping({ centerName, rows }: { centerName: string; rows: ProductRow[] | null }) {
  return (
    <div>
      <p className={`text-sm font-black ${dv.cardHead}`}>1차 영업 상품별 센터/버즈 매핑 현황 <span className={dv.accent}>· {centerName}</span></p>
      <p className={`mb-3 mt-0.5 text-xs ${dv.cardSub}`}>선택 센터의 해당월 1차 영업 상품 집중도</p>
      <div className={`overflow-x-auto rounded-xl border ${dv.tableWrap}`}>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className={`text-xs ${dv.thead}`}>
              <th className="px-4 py-2.5 text-left font-semibold">상품명 (파트너사)</th>
              <th className="px-4 py-2.5 text-right font-semibold">소속 총 버즈회원 수</th>
              <th className="px-4 py-2.5 text-right font-semibold">1차 영업 접수 건수</th>
              <th className="px-4 py-2.5 text-right font-semibold">본부 배정 수당(건당)</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${dv.divide}`}>
            {rows === null && <tr><td colSpan={4} className={`px-4 py-6 text-center ${dv.note}`}>불러오는 중…</td></tr>}
            {rows?.length === 0 && <tr><td colSpan={4} className={`px-4 py-6 text-center ${dv.note}`}>해당월 1차 영업 접수 내역이 없습니다.</td></tr>}
            {rows?.map((p) => (
              <tr key={p.productId} className={dv.rowHover}>
                <td className="px-4 py-2.5">
                  <p className={`font-bold ${dv.cellMain}`}>{p.productName}</p>
                  {p.partnerName && <p className={`text-xs ${dv.cellSub}`}>{p.partnerName}</p>}
                </td>
                <td className={`px-4 py-2.5 text-right ${dv.cellSub}`}>{n(p.buzzCount)} 명</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${dv.cellMain}`}>{n(p.saleCount)} 건</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`font-black ${dv.statTone.fuchsia}`}>{krw(p.rewardPerCase)}</span>
                  {p.rewardRate != null && <span className={`ml-1 text-[10px] ${dv.note}`}>({p.rewardRate}%)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
