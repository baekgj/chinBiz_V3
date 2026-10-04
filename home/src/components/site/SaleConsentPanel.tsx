"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import TermView from "@/components/site/TermView";

type Consent = {
  productId?: number | null; agreeCheck: string;
  provide?: "Y" | "N" | null; marketing?: "Y" | "N" | null;
  managerAssigned?: boolean; managerName?: string | null; managerPhone?: string | null;
};

type AgreeType = "provide" | "marketing";

const ITEMS: { type: AgreeType; label: string; term: string }[] = [
  { type: "provide", label: "개인정보 3자제공", term: "customer_provide" },
  { type: "marketing", label: "마케팅 활용동의", term: "customer_marketing" },
];

const PROVIDE_DENY_MSG = "개인정보 3자제공 미동의 시 매니저 배정이되지 않아 상담이 진행되지 않습니다. 반드시 동의해 주시기 바랍니다.";

/**
 * 상품화면 고객(대표자) 동의 패널 (docs/27). 카카오톡 링크(refId·ordNo)로 진입한 경우에만 노출.
 *  - 개인정보 3자제공: 진입 시 sale.agree_check ≠ Y 이면 [보기]·동의/미동의(radio)
 *                     [동의] → agree 저장 + sale 반영 / [미동의] → 안내 알림만(저장 없음)
 *  - 마케팅 활용동의 : 최초 접속 시 agree(marketing·대표자명·대표자 전화) 최신 기록이 Y면 숨김, 없거나 N이면 노출.
 *                     [동의] → agree 저장 후 숨김 / [미동의] → 저장 없이 영역만 숨김
 *  - 진입 시 sale.agree_check = Y : 매니저 배정완료(이름·연락처) / 매니저 배정중
 */
export default function SaleConsentPanel({ refId, ordNo, productId }: { refId: string; ordNo: string; productId: number }) {
  const [c, setC] = useState<Consent | null>(null);
  const [agreedOnEntry, setAgreedOnEntry] = useState(false);
  const [marketingDone, setMarketingDone] = useState(false); // 마케팅 영역 숨김 (진입 시 Y 기록 / 동의 저장 / 미동의 클릭)
  const [view, setView] = useState<{ term: string; label: string } | null>(null);
  const [busy, setBusy] = useState<AgreeType | null>(null);

  useEffect(() => {
    const q = new URLSearchParams({ refId, ordNo });
    apiGet<Consent>(`/api/public/sale-consent?${q}`).then((r) => {
      if (r.ok && r.data && r.data.productId === productId) {
        setC(r.data);
        setAgreedOnEntry(r.data.agreeCheck === "Y");
        setMarketingDone(r.data.marketing === "Y");
      }
    });
  }, [refId, ordNo, productId]);

  if (!c) return null;

  async function choose(type: AgreeType, check: "Y" | "N") {
    if (type === "provide" && check === "N") { alert(PROVIDE_DENY_MSG); return; } // 3자제공 미동의: 알림만, 저장 안 함
    if (type === "marketing" && check === "N") { setMarketingDone(true); return; } // 마케팅 미동의: 저장 없이 숨김
    setBusy(type);
    const r = await apiPost<Consent>("/api/public/sale-consent", { refId: Number(refId), ordNo, agreeType: type, agreeCheck: check });
    setBusy(null);
    if (r.ok && r.data) {
      setC(r.data);
      if (type === "marketing") setMarketingDone(true); // 마케팅 동의 저장 후 영역 숨김
    } else alert(r.message ?? "저장에 실패했습니다.");
  }

  // 3자제공: 진입 시 sale.agree_check≠Y 일 때 / 마케팅: marketingDone 아닐 때
  const visible = ITEMS.filter((it) => (it.type === "provide" ? !agreedOnEntry : !marketingDone));

  const managerLine = c.managerAssigned
    ? <>매니저 배정완료 : <b>{c.managerName ?? "-"}</b> {c.managerPhone ?? ""}</>
    : <>매니저 배정중</>;

  return (
    <div className="mt-5 rounded-2xl border border-line bg-white p-4 sm:p-5">
      {visible.length > 0 && (
        <>
          <p className="text-xs font-bold text-forest-700">상담 진행을 위해 아래 항목에 동의해 주세요.</p>
          <ul className="mt-3 space-y-2.5">
            {visible.map((it) => {
              const cur = c[it.type];
              const radio = (v: "Y" | "N", text: string) => (
                <label className={`flex cursor-pointer items-center gap-1.5 text-sm font-semibold ${cur === v ? (v === "Y" ? "text-forest-800" : "text-danger") : "text-ink-soft"}`}>
                  <input type="radio" name={`agree-${it.type}`} value={v} checked={cur === v} disabled={busy !== null}
                    onChange={() => choose(it.type, v)} className="h-4 w-4 accent-forest-700" />
                  {text}
                </label>
              );
              return (
                <li key={it.type} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="min-w-[7.5rem] text-sm font-bold text-ink">{it.label}</span>
                  <button type="button" onClick={() => setView({ term: it.term, label: it.label })}
                    className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-ink-soft ring-1 ring-line hover:text-forest-700">보기</button>
                  <span className="text-muted">:</span>
                  {radio("Y", "동의")}
                  {radio("N", "미동의")}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {(agreedOnEntry || c.provide === "Y") && (
        <p className={`text-sm font-bold text-forest-800 ${visible.length > 0 ? "mt-3" : ""}`}>[ {managerLine} ]</p>
      )}

      {view && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onClick={() => setView(null)}>
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="text-lg font-black text-ink">{view.label}</h3>
              <button onClick={() => setView(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-surface">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <TermView code={view.term} variant="modal" />
            </div>
            <div className="border-t border-line px-5 py-3 text-right">
              <button onClick={() => setView(null)} className="rounded-xl bg-forest-800 px-5 py-2 text-sm font-bold text-white hover:bg-forest-700">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
