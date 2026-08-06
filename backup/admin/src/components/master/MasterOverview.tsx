"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, SectionTitle, Badge, StatTile } from "@/components/ui";

type Overview = {
  platform: { partners: number; products: number; divisions: number; centers: number; managers: number; buzz: number };
  pending: { partnerInquiry: number; payoutApproval: number; freeze: number };
  feed: { t: string; tone: string; text: string }[];
};

const num = (n: number | undefined) => (n ?? 0).toLocaleString("ko-KR");

/** 본사 대시보드 — 플랫폼 가동 현황 + 빠른 처리 대기 + 실시간 활동 피드 (DB 연동) */
export default function MasterOverview() {
  const [d, setD] = useState<Overview | null>(null);
  useEffect(() => {
    import("@/lib/api").then(({ apiGet }) =>
      apiGet<Overview>("/api/org/dashboard/overview").then((r) => { if (r.ok && r.data) setD(r.data); })
    );
  }, []);

  const p = d?.platform;
  const platform = [
    { label: "파트너사", value: num(p?.partners), unit: "개" },
    { label: "활성 상품", value: num(p?.products), unit: "종" },
    { label: "본부", value: num(p?.divisions), unit: "개" },
    { label: "센터", value: num(p?.centers), unit: "개" },
    { label: "관리매니저", value: num(p?.managers), unit: "명" },
    { label: "버즈회원", value: num(p?.buzz), unit: "명" },
  ];

  const pending = [
    { label: "파트너사 입점 심사", count: d?.pending.partnerInquiry ?? 0, tone: "warn" as const, href: "/master/partners/inquiries" },
    { label: "MP 확정수당 출금 승인", count: d?.pending.payoutApproval ?? 0, tone: "brand" as const, href: "/master/settlement/payments" },
    { label: "민원 정산 동결(Freeze)", count: d?.pending.freeze ?? 0, tone: "danger" as const, href: "/master/complaints" },
  ];

  return (
    <>
      {/* 플랫폼 가동 현황 */}
      <section>
        <SectionTitle title="플랫폼 가동 현황" sub="조직망·상품·파트너 실시간 규모" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {platform.map((s) => <StatTile key={s.label} {...s} />)}
        </div>
      </section>

      {/* 하단: 처리 대기 + 실시간 피드 */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <SectionTitle title="빠른 처리 대기" sub="승인·심사·동결 건" />
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.label}>
                <Link href={p.href} className="flex items-center justify-between rounded-xl bg-navy-800 px-4 py-3 transition-colors hover:bg-navy-700">
                  <span className="text-sm text-slate-200">{p.label}</span>
                  <Badge tone={p.tone}>{p.count}건</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle title="실시간 활동 피드" sub="정산·심사·민원 이벤트" />
          {!d ? (
            <p className="py-6 text-center text-sm text-slate-500">불러오는 중…</p>
          ) : d.feed.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">최근 활동이 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {d.feed.map((f, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `var(--color-${f.tone})` }} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">{f.text}</p>
                    <p className="text-[11px] text-slate-500">{f.t}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
