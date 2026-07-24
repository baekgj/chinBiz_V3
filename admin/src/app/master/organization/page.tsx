"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import Icon from "@/components/Icon";
import { apiGet } from "@/lib/api";

type Division = { id: number; name: string; salesCenterId: number | null; centerName: string | null };
type Center = { id: number; name: string; salesCenterId: number; centerName: string | null; buzzCount: number; managerCount: number };
type Member = { id: number; name: string; role: string; phone: string | null };

export default function OrganizationPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDiv, setOpenDiv] = useState<Record<number, boolean>>({});
  const [centers, setCenters] = useState<Record<number, Center[]>>({});
  const [openCenter, setOpenCenter] = useState<Record<number, boolean>>({});
  const [members, setMembers] = useState<Record<number, Member[]>>({});

  useEffect(() => {
    apiGet<Division[]>("/api/org/tree/divisions").then((r) => { if (r.data) setDivisions(r.data); setLoading(false); });
  }, []);

  async function toggleDiv(d: Division) {
    const open = !openDiv[d.id];
    setOpenDiv((p) => ({ ...p, [d.id]: open }));
    if (open && !centers[d.id]) {
      const r = await apiGet<Center[]>(`/api/org/tree/centers?divisionId=${d.id}`);
      setCenters((p) => ({ ...p, [d.id]: r.data ?? [] }));
    }
  }
  async function toggleCenter(c: Center) {
    const open = !openCenter[c.id];
    setOpenCenter((p) => ({ ...p, [c.id]: open }));
    if (open && !members[c.id]) {
      const r = await apiGet<Member[]>(`/api/org/tree/members?centerIdx=${c.salesCenterId}`);
      setMembers((p) => ({ ...p, [c.id]: r.data ?? [] }));
    }
  }

  return (
    <div className="space-y-6 animate-float-up">
      <Card>
        <SectionTitle title="본부 ▸ 센터 ▸ 버즈/매니저 트리" sub="본부/센터를 클릭하면 하위 조직이 펼쳐집니다"
          right={<Link href="/master/organization/register" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500">+ 본부·센터 등록</Link>} />

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">불러오는 중…</p>
        ) : divisions.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">등록된 본부가 없습니다. [본부·센터 등록]으로 추가하세요.</p>
        ) : (
          <div className="space-y-2">
            {divisions.map((d) => (
              <div key={d.id} className="rounded-xl border border-line bg-navy-800/40">
                {/* 본부 */}
                <button onClick={() => toggleDiv(d)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
                  <span className="w-4 text-slate-500">{openDiv[d.id] ? "▾" : "▸"}</span>
                  <Icon name="sitemap" className="h-4 w-4 text-brand-400" />
                  <span className="font-bold text-white">{d.centerName ?? d.name}</span>
                  <Badge tone="brand">본부</Badge>
                  <span className="text-xs text-slate-500">{d.name}</span>
                </button>

                {/* 센터 목록 */}
                {openDiv[d.id] && (
                  <div className="ml-5 border-l border-line pl-3 pb-2">
                    {!centers[d.id] ? (
                      <p className="px-3 py-2 text-xs text-slate-500">센터 불러오는 중…</p>
                    ) : centers[d.id].length === 0 ? (
                      <p className="px-3 py-2 text-xs text-slate-500">산하 등록 센터가 없습니다.</p>
                    ) : centers[d.id].map((c) => (
                      <div key={c.id} className="mt-1.5">
                        <button onClick={() => toggleCenter(c)} className="flex w-full items-center gap-2 rounded-lg bg-navy-900 px-3 py-2 text-left">
                          <span className="w-4 text-slate-500">{openCenter[c.id] ? "▾" : "▸"}</span>
                          <Icon name="grid" className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="text-sm font-semibold text-slate-100">{c.centerName ?? c.name}</span>
                          <Badge tone="warn">센터</Badge>
                          <span className="text-xs text-slate-500">{c.name}</span>
                          <span className="ml-auto text-[11px] text-slate-400">버즈 {c.buzzCount} · 매니저 {c.managerCount}</span>
                        </button>

                        {/* 버즈/매니저 */}
                        {openCenter[c.id] && (
                          <div className="ml-6 border-l border-line pl-3">
                            {!members[c.id] ? (
                              <p className="px-3 py-1.5 text-xs text-slate-500">불러오는 중…</p>
                            ) : members[c.id].length === 0 ? (
                              <p className="px-3 py-1.5 text-xs text-slate-500">소속 버즈/매니저가 없습니다.</p>
                            ) : members[c.id].map((m) => (
                              <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                                <span className="h-1 w-1 rounded-full bg-slate-500" />
                                <span className="text-slate-200">{m.name}</span>
                                <Badge tone={m.role === "MANAGER" ? "brand" : "slate"}>{m.role === "MANAGER" ? "매니저" : "버즈"}</Badge>
                                {m.phone && <span className="text-xs text-slate-500">{m.phone}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
