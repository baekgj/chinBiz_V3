"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { krw } from "@/components/ui";
import { apiGet } from "@/lib/api";

type Dash = { gmv: number; gmvRate: number; profit: number; profitRate: number };

function RateChip({ rate, dark }: { rate: number; dark?: boolean }) {
  const up = rate >= 0;
  const cls = dark ? "bg-navy-950/15 text-navy-950" : "bg-white/15 text-white";
  return (
    <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      <Icon name="trend" className="h-3.5 w-3.5" /> 전월 대비 {up ? "▲" : "▼"} {Math.abs(rate)}%
    </span>
  );
}

/** 본사 대시보드 KPI — 금월 GMV(전월대비) / 본사 확정수익(전월대비) DB 연동 */
export default function MasterKpi() {
  const [d, setD] = useState<Dash>({ gmv: 0, gmvRate: 0, profit: 0, profitRate: 0 });
  useEffect(() => { apiGet<Dash>("/api/org/dashboard").then((r) => { if (r.ok && r.data) setD(r.data); }); }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 p-6">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-white/80">금월 플랫폼 총 거래액 (GMV)</p>
            <p className="mt-2 text-4xl font-black text-white">{krw(d.gmv)}</p>
            <RateChip rate={d.gmvRate} />
          </div>
          <Icon name="trend" className="h-8 w-8 text-white/70" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 p-6">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-navy-950/70">본사 누적 정산 확정수익 (Net Profit)</p>
            <p className="mt-2 text-4xl font-black text-navy-950">{krw(d.profit)}</p>
            <RateChip rate={d.profitRate} dark />
          </div>
          <Icon name="wallet" className="h-8 w-8 text-navy-950/60" />
        </div>
      </div>
    </div>
  );
}
