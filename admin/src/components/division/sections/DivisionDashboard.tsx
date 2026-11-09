"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { dv, Card, Stat } from "@/components/division/DivisionUI";
import WalletSection from "@/components/division/sections/WalletSection";

type Me = { name?: string; salesCenterName?: string | null };
type CenterHead = { idx: number; centerCode: string; centerName: string; headUserId: string | null; headName: string | null; headPhone: string | null };
type Dash = {
  cp: number; mp: number; centerCount: number; buzzCount: number; productKinds: number; headAssigned: number;
  centers: CenterHead[];
};

/** 본부분석 대시보드 (docs/24, docs/35-1) — 헤더 + CP/MP + 산하 현황 + 소속센터 센터장 지정 현황 (모두 실데이터) */
export default function DivisionDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [d, setD] = useState<Dash | null>(null);
  useEffect(() => {
    apiGet<Me>("/api/user/me").then((r) => { if (r.data) setMe(r.data); });
    apiGet<Dash>("/api/division/dashboard").then((r) => { if (r.ok && r.data) setD(r.data); });
  }, []);
  const region = me?.salesCenterName ?? "광역 관할";
  const n = (v?: number) => (v ?? 0).toLocaleString("ko-KR");

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

      {/* CP / MP */}
      <WalletSection cp={d?.cp ?? 0} mp={d?.mp ?? 0} />

      {/* 산하 현황 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="본부 산하 총 센터 수" value={n(d?.centerCount)} unit="개 센터" tone="violet" />
        <Stat label="본부 산하 총 소속 버즈회원 수" value={n(d?.buzzCount)} unit="명" tone="fuchsia" />
        <Stat label="진행 중인 1차 영업 상품 종류 수" value={n(d?.productKinds)} unit="종" tone="slate" />
      </div>

      {/* 소속센터 센터장 지정 현황 */}
      <Card title="소속센터 센터장 지정 현황" sub="본부 소속 센터 전체 · 본사 [본부ᆞ센터 리스트]에서 할당된 센터장 정보 (미할당 시 [미등록])"
        right={d && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${dv.badge}`}>지정 {d.headAssigned} / {d.centerCount}</span>}>
        <div className={`overflow-x-auto rounded-xl border ${dv.tableWrap}`}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className={`text-xs ${dv.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">센터코드</th>
                <th className="px-4 py-3 text-left font-semibold">센터명</th>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">센터장명</th>
                <th className="px-4 py-3 text-left font-semibold">연락처</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dv.divide}`}>
              {!d && <tr><td colSpan={5} className={`px-4 py-8 text-center ${dv.note}`}>불러오는 중…</td></tr>}
              {d && d.centers.length === 0 && <tr><td colSpan={5} className={`px-4 py-8 text-center ${dv.note}`}>산하 센터가 없습니다.</td></tr>}
              {d?.centers.map((c) => (
                <tr key={c.idx} className={dv.rowHover}>
                  <td className={`px-4 py-3 ${dv.cellSub}`}>{c.centerCode}</td>
                  <td className={`px-4 py-3 font-bold ${dv.cellMain}`}>{c.centerName}</td>
                  {c.headUserId ? (
                    <>
                      <td className={`px-4 py-3 ${dv.cellMain}`}>{c.headUserId}</td>
                      <td className={`px-4 py-3 ${dv.cellMain}`}>{c.headName || "-"}</td>
                      <td className={`px-4 py-3 ${dv.cellSub}`}>{c.headPhone || "-"}</td>
                    </>
                  ) : (
                    <td colSpan={3} className={`px-4 py-3 ${dv.note}`}>[미등록]</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
