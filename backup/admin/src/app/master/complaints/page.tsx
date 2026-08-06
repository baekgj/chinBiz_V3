"use client";

import { useState } from "react";
import { Card, SectionTitle, Badge, StatTile } from "@/components/ui";

type VOC = {
  id: number; tag: string; tagTone: "danger" | "warn" | "slate";
  place: string; text: string; via: string; done?: boolean;
};

const INIT: VOC[] = [
  { id: 1, tag: "긴급 · 설치 지연", tagTone: "danger", place: "종로가든", text: "매니저 방문 일정이 조율되지 않아 주방 오픈에 차질이 생겼다고 컴플레인함", via: "외부_정매니저" },
  { id: 2, tag: "긴급 · 상품 불량", tagTone: "danger", place: "명동 갈비하우스", text: "석쇠 세척기 도색 불량, 교환 요청", via: "버즈_박OO" },
  { id: 3, tag: "일반 · 상품 문의", tagTone: "slate", place: "대박식당 신촌점", text: "세척기 전용 세제 추가 구매 경로 문의", via: "버즈_김OO", done: true },
];

export default function ComplaintsPage() {
  const [frozen, setFrozen] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-6 animate-float-up">
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="미처리 민원" value="7" unit="건" />
        <StatTile label="처리 완료" value="128" unit="건" />
        <StatTile label="정산 동결(Freeze)" value={String(3 + Object.values(frozen).filter(Boolean).length)} unit="건" />
      </div>

      <Card>
        <SectionTitle title="3자 결합 민원 관리" sub="고객·버즈·매니저 인입 VOC 통합 — 민원 접수 시 계약 SETTLEMENT_FREEZE 전환" />
        <ul className="space-y-3">
          {INIT.map((v) => (
            <li key={v.id} className={`rounded-xl border p-4 ${v.done ? "border-line bg-navy-800/40" : "border-danger/30 bg-danger/5"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge tone={v.done ? "pos" : v.tagTone}>{v.done ? "처리 완료" : v.tag}</Badge>
                  <span className="font-bold text-white">{v.place}</span>
                </div>
                <span className="text-xs text-slate-500">접수: {v.via}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">&ldquo;{v.text}&rdquo;</p>
              {!v.done && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500">즉시 조치 가이드 발송</button>
                  {frozen[v.id] ? (
                    <span className="inline-flex items-center rounded-lg bg-warn/10 px-3 py-1.5 text-xs font-bold text-warn ring-1 ring-warn/30">
                      🔒 수당 확정 동결됨 (SETTLEMENT_FREEZE)
                    </span>
                  ) : (
                    <button
                      onClick={() => setFrozen((p) => ({ ...p, [v.id]: true }))}
                      className="rounded-lg border border-warn/40 px-3 py-1.5 text-xs font-bold text-warn hover:bg-warn/10"
                    >
                      수당 확정 동결 (Freeze)
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
