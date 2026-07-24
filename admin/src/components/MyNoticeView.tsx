"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

/** 역할별 내 공지 뷰에서 쓰는 테마 클래스 토큰 (버즈/본부/센터 각 테마에서 주입) */
export type NoticeTokens = {
  card: string;      // 상세 모달 패널 (border+bg+padding 포함)
  box: string;       // 목록 행 테두리
  hover: string;     // 행 hover
  badge: string;     // 대상 배지
  main: string;      // 주 텍스트(제목)
  cellSub: string;   // 보조 텍스트
  note: string;      // 흐린 텍스트(날짜)
  btn: string;       // 기본 버튼
};

type Notice = { id: number; title: string; targetName: string; allFlag: boolean; createdAt: string };
type Detail = Notice & { content: string };
type PageResp = { content: Notice[]; page: number; totalPages: number; totalElements: number };

const SIZE = 10;

/**
 * 로그인 사용자 역할 기준 공지 리스트 + 상세보기 모달 (/api/my/notices)
 * asRole: 뷰 오버라이드. 매니저가 버즈 뷰일 때 "BUZZ" → 버즈 공지 표시.
 */
export default function MyNoticeView({ c, asRole }: { c: NoticeTokens; asRole?: string }) {
  const [rows, setRows] = useState<Notice[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Detail | null>(null);
  const asQ = asRole ? `&as=${asRole}` : "";

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const r = await apiGet<PageResp>(`/api/my/notices?page=${p}&size=${SIZE}${asQ}`);
    if (r.data) { setRows(r.data.content); setTotalPages(r.data.totalPages || 1); setTotal(r.data.totalElements); setPage(r.data.page); }
    setLoading(false);
  }, [asQ]);

  useEffect(() => { load(0); }, [load]);

  const open = async (id: number) => {
    const r = await apiGet<Detail>(`/api/my/notices/${id}?${asQ.slice(1)}`);
    if (r.ok && r.data) setSel(r.data);
  };

  const fmt = (s: string) => s?.slice(0, 16).replace("T", " ");

  return (
    <div>
      <p className={`mb-3 text-xs ${c.note}`}>총 {total}건</p>
      {loading ? (
        <p className={`py-10 text-center text-sm ${c.note}`}>불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className={`py-10 text-center text-sm ${c.note}`}>등록된 공지가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((n) => (
            <button key={n.id} onClick={() => open(n.id)}
              className={`block w-full rounded-xl border p-4 text-left transition-colors ${c.box} ${c.hover}`}>
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.badge}`}>{n.targetName}</span>
                <span className={`text-xs ${c.note}`}>{fmt(n.createdAt)}</span>
              </div>
              <p className={`font-bold ${c.main}`}>{n.title}</p>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button disabled={page <= 0} onClick={() => load(page - 1)} className={`rounded-lg border px-3 py-1.5 text-sm ${c.box} ${c.cellSub} disabled:opacity-40`}>이전</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => load(i)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i === page ? c.btn : `border ${c.box} ${c.cellSub}`}`}>{i + 1}</button>
          ))}
          <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} className={`rounded-lg border px-3 py-1.5 text-sm ${c.box} ${c.cellSub} disabled:opacity-40`}>다음</button>
        </div>
      )}

      {/* 상세보기 모달 */}
      {sel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setSel(null)}>
          <div className={`w-full max-w-2xl rounded-2xl ${c.card}`} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.badge}`}>{sel.targetName}</span>
                  <span className={`text-xs ${c.note}`}>{fmt(sel.createdAt)}</span>
                </div>
                <h3 className={`text-lg font-black ${c.main}`}>{sel.title}</h3>
              </div>
              <button onClick={() => setSel(null)} className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold ${c.btn}`}>닫기</button>
            </div>
            <div className={`whitespace-pre-wrap text-sm leading-relaxed ${c.cellSub}`}>{sel.content || "내용이 없습니다."}</div>
          </div>
        </div>
      )}
    </div>
  );
}
