"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet } from "@/lib/api";

type Detail = {
  id: number; status?: string; group?: string; productName?: string; createdAt?: string; updatedAt?: string;
  buzzName?: string; companyName?: string; businessNumber?: string; ceoName?: string; companyPhone?: string;
  managerContactName?: string; phone?: string; email?: string; zipcode?: string; address?: string; addressDetail?: string; memo?: string;
  managerId?: number | null; managerName?: string; assigned?: boolean;
};

const groupTone: Record<string, string> = {
  진행중: "bg-sky-100 text-sky-700",
  계약완료: "bg-indigo-100 text-indigo-700",
  설치완료: "bg-emerald-100 text-emerald-700",
  취소반품: "bg-red-100 text-red-700",
};

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="shrink-0 text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-right text-sm text-slate-800">{value || "-"}</span>
    </div>
  );
}

/** 파트너 영업 상세 팝업 — 1차(버즈 등록) / 2차(매니저 배정) 현황 */
export default function SaleDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    apiGet<Detail>(`/api/partner/sales/${id}`).then((r) => {
      if (r.ok && r.data) setD(r.data); else setErr(r.message ?? "영업 건을 찾을 수 없습니다.");
    });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    // 팝업 열림 동안 배경 스크롤 잠금
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [id, onClose]);

  if (!mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">{d?.companyName ?? "영업 상세"}</h3>
            <p className="text-xs text-slate-500">{d?.productName ?? ""}</p>
          </div>
          <div className="flex items-center gap-3">
            {d?.status && <span className={`rounded-full px-3 py-1 text-xs font-bold ${groupTone[d.group ?? ""] ?? "bg-slate-100 text-slate-600"}`}>{d.status}</span>}
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">✕</button>
          </div>
        </div>

        {err ? (
          <div className="px-5 py-10 text-center text-sm text-red-500">{err}</div>
        ) : !d ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">불러오는 중…</div>
        ) : (
          <div className="space-y-4 px-5 py-5">
            {/* 1차 영업 (버즈 등록) */}
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">1차 영업</span>
                <span className="text-sm font-bold text-slate-800">버즈 등록 정보</span>
              </div>
              <Row label="1차 접수자(버즈)" value={d.buzzName} />
              <Row label="접수 상품" value={d.productName} />
              <Row label="상호명" value={d.companyName} />
              <Row label="사업자등록번호" value={d.businessNumber} />
              <Row label="대표자명" value={d.ceoName} />
              <Row label="회사 전화번호" value={d.companyPhone} />
              <Row label="담당자명" value={d.managerContactName} />
              <Row label="핸드폰번호" value={d.phone} />
              <Row label="이메일" value={d.email} />
              <Row label="회사 주소" value={[d.zipcode, d.address, d.addressDetail].filter(Boolean).join(" ")} />
              <Row label="등록일" value={d.createdAt?.slice(0, 10)} />
              {d.memo && <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><b className="text-xs text-slate-500">메모</b><br />{d.memo}</div>}
            </section>

            {/* 2차 영업 (매니저 배정) */}
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">2차 영업</span>
                <span className="text-sm font-bold text-slate-800">관리매니저 배정 현황</span>
              </div>
              <Row label="배정 상태" value={d.assigned ? "배정 완료" : "미배정 (지역 선착순 대기)"} />
              <Row label="2차 담당자(매니저)" value={d.managerName ?? (d.assigned ? "-" : "미배정")} />
              <Row label="현재 진행 단계" value={d.status} />
              <Row label="최종 업데이트" value={d.updatedAt?.slice(0, 10)} />
            </section>
          </div>
        )}

        {/* 하단 닫기 버튼 */}
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
          <button onClick={onClose} className="rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-900">닫기</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
