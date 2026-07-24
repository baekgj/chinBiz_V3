"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { Card, ct } from "@/components/center/CenterUI";
import { apiGet } from "@/lib/api";

type Dash = { cp: number; cpBuzz: number; cpManager: number; mp: number; mpBuzz: number; mpManager: number };

/** 센터 요약 — 이달 CP/MP (Allowance: BUZZ_CENTER+MANAGER_CENTER, 버즈/매니저 분리) */
export default function WalletSection() {
  const [d, setD] = useState<Dash>({ cp: 0, cpBuzz: 0, cpManager: 0, mp: 0, mpBuzz: 0, mpManager: 0 });
  useEffect(() => { apiGet<Dash>("/api/center/dashboard").then((r) => { if (r.ok && r.data) setD(r.data); }); }, []);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`rounded-2xl p-5 shadow-sm ${ct.cpCard}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-200/70">CP · 센터 총합 예정수당</p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">진행 중</span>
          </div>
          <p className="mt-2 text-3xl font-black text-amber-300">{krw(d.cp)}</p>
          <p className="mt-1 text-xs text-amber-200/60">하부 조직이 현재 진행 중인 모든 영업의 지사 배정액</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-xs">
            <span>버즈 <b>{krw(d.cpBuzz)}</b></span><span className="opacity-50">+</span>
            <span>매니저 <b>{krw(d.cpManager)}</b></span>
          </div>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm ${ct.mpCard}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold">MP · 센터 총합 확정수당</p>
            <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold">출금 가능</span>
          </div>
          <p className="mt-2 text-3xl font-black">{krw(d.mp)}</p>
          <p className="mt-1 text-xs opacity-90">구매확정 완료되어 출금 가능한 센터 순수익</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-xs">
            <span>버즈 <b>{krw(d.mpBuzz)}</b></span><span className="opacity-50">+</span>
            <span>매니저 <b>{krw(d.mpManager)}</b></span>
          </div>
        </div>
      </div>

      <Card title="조직별 센터 배정 수당 세부 명세" sub="소속(버즈 1차) / 관리(매니저 2차) 수당 분리">
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { title: "버즈회원 영업 기반 센터 소속 수당", cp: d.cpBuzz, mp: d.mpBuzz, cpDesc: "소속 버즈회원의 1차 영업 진행 건", mpDesc: "구매확정 완료된 1차 영업 기반 수익", action: { label: "소속 버즈회원별 정산 리포트 ›", href: "/center/settlement" } },
            { title: "관리매니저 영업 기반 센터 관리 수당", cp: d.cpManager, mp: d.mpManager, cpDesc: "소속 매니저의 2차 관리 진행 건", mpDesc: "최종 완결·구매확정 완료된 2차 관리 수익", action: { label: "소속 관리매니저별 정산 리포트 ›", href: "/center/settlement/manager" } },
          ].map((b) => (
            <div key={b.title} className={`rounded-xl border p-4 ${ct.tableWrap}`}>
              <h4 className={`text-sm font-black ${ct.cardHead}`}>{b.title}</h4>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${ct.badge}`}>CP</span>
                  <p className={`mt-1 text-lg font-black ${ct.statTone.gold}`}>{krw(b.cp)}</p>
                  <p className={`text-[11px] ${ct.note}`}>{b.cpDesc}</p>
                </div>
                <div>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">MP · 출금가능</span>
                  <p className={`mt-1 text-lg font-black ${ct.statTone.emerald}`}>{krw(b.mp)}</p>
                  <p className={`text-[11px] ${ct.note}`}>{b.mpDesc}</p>
                </div>
              </div>
              <Link href={b.action.href} className={`mt-3 block rounded-lg px-3 py-2 text-center text-xs font-bold ${ct.outlineBtn}`}>{b.action.label}</Link>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
