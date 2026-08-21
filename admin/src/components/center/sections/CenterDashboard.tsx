"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { ct, Card } from "@/components/center/CenterUI";
import WalletSection from "@/components/center/sections/WalletSection";

type Me = { name?: string; salesCenterName?: string | null };
type Mgr = { id: number; name?: string; managerStatus?: string; managerSdate?: string; managerEdate?: string };

/** 센터 대시보드 (docs/24) — 헤더/관할 요약 + 센터 오버라이딩 수수료(실데이터) + 매니저 가동현황 + 관제 패널 */
export default function CenterDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [mgrs, setMgrs] = useState<Mgr[]>([]);
  const [buzzCount, setBuzzCount] = useState(0);

  useEffect(() => {
    apiGet<Me>("/api/user/me").then((r) => { if (r.data) setMe(r.data); });
    apiGet<{ content: Mgr[] }>("/api/center/managers").then((r) => { if (r.data) setMgrs(r.data.content ?? []); });
    apiGet<{ content: unknown[] }>("/api/center/buzz-members").then((r) => { if (r.data?.content) setBuzzCount(r.data.content.length); });
  }, []);

  const region = me?.salesCenterName ?? "관할 미지정";

  return (
    <div className="space-y-5">
      {/* 헤더 / 관할 요약 */}
      <div className={ct.card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-lg font-black ${ct.brand}`}>🏢 [{region} 센터] 상품 관제 & 리드 배정 대시보드</p>
            <p className={`mt-1 text-sm ${ct.cardSub}`}>
              관할 구역: <b className={ct.accent}>{region}</b> · 소속 매니저 <b className={ct.accent}>{mgrs.length}명</b> · 소속 버즈 <b className={ct.accent}>{buzzCount}명</b>
            </p>
          </div>
          <Link href="/center/profile" className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${ct.outlineBtn}`}>MY 프로필 &gt;</Link>
        </div>
      </div>

      {/* 센터 오버라이딩 수수료 & 실적 요약 (실데이터) */}
      <WalletSection />

      {/* 관할 관리매니저 이행 및 가동 현황 */}
      <Card title="관할 관리매니저 이행 및 가동 현황" sub="센터 승인 활동 매니저"
        right={<Link href="/center/managers" className={`text-sm font-bold ${ct.accent}`}>매니저관리 &gt;</Link>}>
        <div className={`overflow-x-auto rounded-xl border ${ct.tableWrap}`}>
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className={`text-xs ${ct.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">매니저명</th>
                <th className="px-4 py-3 text-left font-semibold">신청일</th>
                <th className="px-4 py-3 text-left font-semibold">승인일</th>
                <th className="px-4 py-3 text-center font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${ct.divide}`}>
              {mgrs.length === 0 ? (
                <tr><td colSpan={4} className={`px-4 py-8 text-center ${ct.note}`}>승인 활동 매니저가 없습니다.</td></tr>
              ) : mgrs.map((m) => (
                <tr key={m.id} className={ct.rowHover}>
                  <td className={`px-4 py-3 font-bold ${ct.cellMain}`}>{m.name ?? "-"}</td>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{m.managerSdate ?? "-"}</td>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{m.managerEdate ?? "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${m.managerStatus === "Y" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {m.managerStatus === "Y" ? "🟢 활동중" : "심사중"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 관할 배정 지연 관제 (신규 집계 엔드포인트 연동 예정) */}
      <Card title="관할 구역 배정 지연 및 긴급 관제 리드" sub="접수 후 2시간 이상 미수락 리드 강제 배정"
        right={<Link href="/center/managers/sales" className={`text-sm font-bold ${ct.accent}`}>2차영업관리 &gt;</Link>}>
        <p className={`py-8 text-center text-sm ${ct.note}`}>배정 지연 관제(타임아웃) 데이터 연동은 준비 중입니다. (현재는 [매니저관리]의 강제배정 기능 이용)</p>
      </Card>

      {/* 상품별 센터 수익 기여도 TOP 3 (신규 집계 엔드포인트 연동 예정) */}
      <Card title="상품별 센터 수익 기여도 TOP 3" sub="당월 기준">
        <p className={`py-8 text-center text-sm ${ct.note}`}>상품별 수익 기여도 집계는 준비 중입니다.</p>
      </Card>
    </div>
  );
}
