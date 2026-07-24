"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPost } from "@/lib/api";
import { useBuzz } from "@/components/buzz/theme";

type Detail = Record<string, unknown> & {
  id: number; productName?: string; customerName?: string; companyName?: string; ceoName?: string;
  phone?: string; address?: string; addressDetail?: string; status?: string; memo?: string; mine?: boolean;
};
const STAGES = ["접수", "상담/방문", "계약체결", "배송/설치", "구매확정", "취소/반품"];

/** 매니저 영업관리(우선할당/영업권확보) — 진행현황·영업내용 기록 후 sales.manager_id 저장 */
export default function AssignModal({ saleId, onClose, onSaved }: { saleId: number; onClose: () => void; onSaved: () => void }) {
  const { theme } = useBuzz();
  const [d, setD] = useState<Detail | null>(null);
  const [status, setStatus] = useState("상담/방문");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    apiGet<Detail>(`/api/buzz/sales/${saleId}`).then((r) => {
      if (r.ok && r.data) { setD(r.data); if (r.data.status) setStatus(r.data.status); setMemo(r.data.memo ?? ""); }
      else setErr(r.message ?? "영업 건을 불러오지 못했습니다.");
    });
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [saleId]);

  async function save() {
    setSaving(true); setErr(null);
    const res = await apiPost(`/api/buzz/sales/${saleId}/assign`, { status, memo });
    setSaving(false);
    if (res.ok) { onSaved(); onClose(); }
    else setErr(res.message ?? "저장에 실패했습니다.");
  }

  if (!mounted) return null;
  const dark = theme.card.includes("neutral");
  const panel = dark ? "bg-neutral-900 text-neutral-100" : "bg-white text-slate-900";
  const inp = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${theme.input}`;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl shadow-xl ${panel}`} onClick={(e) => e.stopPropagation()}>
        <div className={`flex items-center justify-between border-b px-5 py-4 ${theme.tableWrap}`}>
          <div>
            <h3 className="text-lg font-black">{d?.mine ? "영업권 확보 · 관리" : "우선 할당"}</h3>
            <p className={`text-xs ${theme.cardSub}`}>{d?.productName} · {d?.companyName ?? d?.customerName}</p>
          </div>
          <button onClick={onClose} className={`grid h-8 w-8 place-items-center rounded-lg ${theme.cellSub} hover:opacity-70`}>✕</button>
        </div>

        {err && <div className="mx-5 mt-4 rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-500">{err}</div>}

        {!d ? <div className={`px-5 py-10 text-center text-sm ${theme.cardSub}`}>불러오는 중…</div> : (
          <div className="space-y-4 px-5 py-5">
            <div className={`rounded-xl border p-4 ${theme.tableWrap}`}>
              <p className={`text-xs ${theme.cardSub}`}>고객</p>
              <p className={`font-bold ${theme.cellMain}`}>{d.companyName ?? d.customerName}{d.ceoName ? ` · ${d.ceoName}` : ""}</p>
              <p className={`mt-0.5 text-xs ${theme.cellSub}`}>{[d.phone, d.address, d.addressDetail].filter(Boolean).join(" · ")}</p>
            </div>
            <label className="block">
              <span className={`text-xs font-semibold ${theme.fieldLabel}`}>영업 진행현황</span>
              <select className={`mt-1 ${inp}`} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={`text-xs font-semibold ${theme.fieldLabel}`}>영업 내용</span>
              <textarea rows={4} className={`mt-1 ${inp}`} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="상담·방문·진행 내용을 기록하세요" />
            </label>
          </div>
        )}

        <div className={`sticky bottom-0 flex justify-end gap-2 border-t px-5 py-3 ${theme.tableWrap} ${panel}`}>
          <button onClick={onClose} className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${theme.cancelBtn}`}>취소</button>
          <button onClick={save} disabled={saving || !d} className={`rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60 ${theme.primaryBtn}`}>
            {saving ? "저장 중…" : d?.mine ? "저장" : "영업권 확보"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
