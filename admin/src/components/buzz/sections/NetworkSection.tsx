"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet } from "@/lib/api";

type Member = { id: number; userId: string; name: string; role: string; status: string; joinDate: string };
type PageResp = { content: Member[]; page: number; totalPages: number; totalElements: number };

const SIZE = 10;
const roleLabel = (r: string) => (r === "MANAGER" ? "관리매니저" : "버즈회원");

/** 버즈 네트워크 — 내가 추천/등록한 회원 관리 (검색·가입일 캘린더·페이징) */
export default function NetworkSection() {
  const { theme, role } = useBuzz();
  const [mgrStatus, setMgrStatus] = useState<string>("N");
  useEffect(() => { apiGet<{ managerStatus: string }>("/api/buzz/manager/status").then((r) => { if (r.data?.managerStatus) setMgrStatus(r.data.managerStatus); }); }, []);
  const [rows, setRows] = useState<Member[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // 검색 조건
  const [kw, setKw] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [q, setQ] = useState({ kw: "", from: "", to: "" }); // 적용된 조건

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), size: String(SIZE) });
    if (q.kw) params.set("keyword", q.kw);
    if (q.from) params.set("from", q.from);
    if (q.to) params.set("to", q.to);
    const r = await apiGet<PageResp>(`/api/buzz/members?${params}`);
    if (r.data) { setRows(r.data.content); setTotalPages(r.data.totalPages || 1); setTotal(r.data.totalElements); setPage(r.data.page); }
    setLoading(false);
  }, [q]);

  useEffect(() => { load(0); }, [load]);

  const search = () => setQ({ kw, from, to });
  const reset = () => { setKw(""); setFrom(""); setTo(""); setQ({ kw: "", from: "", to: "" }); };

  const inputCls = `rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-slate-400 ${theme.input}`;
  // 내 추천 링크: https://chinbiz.kr/signup?ref=(로그인 회원id)
  const [myId, setMyId] = useState("");
  useEffect(() => { apiGet<{ userId: string }>("/api/user/me").then((r) => { if (r.data?.userId) setMyId(r.data.userId); }); }, []);
  const refUrl = `https://chinbiz.kr/signup?ref=${myId || "..."}`;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    // HTTPS(보안 컨텍스트)에선 Clipboard API, 아니면(HTTP) execCommand 폴백 — 전체 URL이 항상 복사되도록
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(refUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = refUrl; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
      }
    } catch { /* noop */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      <Card title="내 추천 링크" sub="이 링크로 가입한 하위 버즈 수익의 약 10%를 MP로 평생 적립">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className={`flex-1 truncate rounded-lg border px-3 py-2 text-sm ${theme.codeBox}`}>{refUrl}</code>
          <button onClick={copy} className={`rounded-lg px-4 py-2 text-sm font-bold ${theme.primaryBtn}`}>{copied ? "복사됨 ✓" : "링크 복사"}</button>
        </div>
      </Card>

      <Card
        title="내 버즈 네트워크"
        sub={`총 ${total}명 · 내가 추천/등록한 회원`}
        right={
          <div className="flex items-center gap-2">
            {/* 매니저 승급: 신청 이력 없으면 [매니저 신청하기](BUZZ), 있으면 [매니저신청현황] */}
            {mgrStatus === "N"
              ? (role === "BUZZ" && <Link href="/buzz/network/manager-apply" className={`rounded-xl px-4 py-2 text-sm font-bold ${theme.outlineBtn}`}>매니저 신청하기</Link>)
              : <Link href="/buzz/network/manager-apply" className={`rounded-xl px-4 py-2 text-sm font-bold ${theme.outlineBtn}`}>매니저신청현황</Link>}
            <Link href="/buzz/network/new" className={`rounded-xl px-4 py-2 text-sm font-bold ${theme.primaryBtn}`}>+ 회원 등록</Link>
          </div>
        }
      >
        {/* 검색 */}
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div>
            <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>아이디/이름</p>
            <input className={inputCls} value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="검색어" />
          </div>
          <div>
            <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>가입일 (시작)</p>
            <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>가입일 (종료)</p>
            <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button onClick={search} className={`rounded-lg px-4 py-2 text-sm font-bold ${theme.primaryBtn}`}>검색</button>
          <button onClick={reset} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${theme.tableWrap} ${theme.cellSub}`}>초기화</button>
        </div>

        <div className={`overflow-x-auto rounded-xl border ${theme.tableWrap}`}>
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className={`text-xs ${theme.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">가입일</th>
                <th className="px-4 py-3 text-left font-semibold">아이디</th>
                <th className="px-4 py-3 text-left font-semibold">회원명</th>
                <th className="px-4 py-3 text-center font-semibold">역할</th>
                <th className="px-4 py-3 text-center font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.divide}`}>
              {loading ? (
                <tr><td colSpan={5} className={`px-4 py-10 text-center ${theme.note}`}>불러오는 중…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className={`px-4 py-10 text-center ${theme.note}`}>회원이 없습니다. [+ 회원 등록]으로 추가하세요.</td></tr>
              ) : rows.map((m) => (
                <tr key={m.id} className={theme.rowHover}>
                  <td className={`px-4 py-3 ${theme.cellSub}`}>{m.joinDate}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${theme.cellSub}`}>{m.userId}</td>
                  <td className="px-4 py-3">
                    <Link href={`/buzz/network/${m.id}`} className={`font-bold hover:underline ${theme.cellMain}`}>{m.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${theme.goldBadge}`}>{roleLabel(m.role)}</span></td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${m.status === "ACTIVE" ? theme.stageOn : "bg-slate-200 text-slate-500"}`}>{m.status === "ACTIVE" ? "활동" : "휴면"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이징 */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button disabled={page <= 0} onClick={() => load(page - 1)} className={`rounded-lg border px-3 py-1.5 text-sm ${theme.tableWrap} ${theme.cellSub} disabled:opacity-40`}>이전</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => load(i)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i === page ? theme.primaryBtn : `border ${theme.tableWrap} ${theme.cellSub}`}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} className={`rounded-lg border px-3 py-1.5 text-sm ${theme.tableWrap} ${theme.cellSub} disabled:opacity-40`}>다음</button>
          </div>
        )}
      </Card>
    </div>
  );
}
