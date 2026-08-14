"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { krw } from "@/components/ui";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet, apiPost } from "@/lib/api";

/** 이름 마스킹: 홍길동 → 홍*동 */
function maskName(n: string): string {
  if (!n) return "-";
  if (n.length <= 1) return n;
  if (n.length === 2) return n[0] + "*";
  return n[0] + "*".repeat(n.length - 2) + n[n.length - 1];
}

type Dash = { cp: number; mp: number; confirmedMp: number; cumulativeMp: number };
type MCenter = { centerName: string; status: string };
type Lead = { id: number; createdAt?: string; productName?: string; customerName?: string; buzzName?: string; centerName?: string; status?: string; eduApproved?: boolean };
type Managed = { id: number; status?: string; customerName?: string };
type Prod = { id: number; name: string; image1?: string; autoAssign?: boolean; categoryName?: string; partnerName?: string };
type EduRow = { productId: number; productName: string; partnerName?: string };
type Notice = { id: number; title: string; createdAt: string };

// 2차 영업 5단계 (실제 status → 표시 단계)
const STAGE_MAP: { label: string; statuses: string[] }[] = [
  { label: "상담대기", statuses: ["접수"] },
  { label: "방문/실사", statuses: ["상담/방문"] },
  { label: "계약보조", statuses: ["계약체결"] },
  { label: "최종성공", statuses: ["배송/설치"] },
  { label: "정산완료", statuses: ["구매확정"] },
];

// 활동 가이드 4-Step (docs/23 Task4)
const GUIDE: { step: string; menu: string; desc: string }[] = [
  { step: "Step 1", menu: "교육관리", desc: "메뉴에서 ‘상품’을 선택하여 해당 상품의 영업/실사 교육을 이수합니다." },
  { step: "Step 2", menu: "관리마켓", desc: "교육을 이수한 상품에 대해 ‘자동배정’을 선택/활성화합니다." },
  { step: "Step 3", menu: "영업관리 (1차 배정)", desc: "‘버즈1차접수현황’ 목록에서 리드(가망고객)를 직접 선택하거나 관할 구역 자동배정으로 리드를 인계 받습니다." },
  { step: "Step 4", menu: "2차영업관리 (현장 이행)", desc: "배정된 리드 목록을 확인하고, 가망고객 상담·현장 방문·실사 사진 업로드·계약 체결 등을 진행합니다." },
];

/** 관리매니저 대시보드 (docs/23) — 환영·수당 / 활동가이드 / 신규1차리드 / 2차영업 / 교육·마켓 / 공지 */
export default function ManagerDashboardSection() {
  const { theme, name } = useBuzz();
  const router = useRouter();
  const [dash, setDash] = useState<Dash>({ cp: 0, mp: 0, confirmedMp: 0, cumulativeMp: 0 });
  const [centers, setCenters] = useState<MCenter[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [managed, setManaged] = useState<Managed[]>([]);
  const [eduDone, setEduDone] = useState<Prod[]>([]);
  const [eduTodo, setEduTodo] = useState<EduRow[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);       // 핵심 활동 가이드 팝업
  const [guideCollapsed, setGuideCollapsed] = useState(false); // 활동 가이드 카드 접기/열기
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadLeads = useCallback(() => {
    apiGet<{ content: Lead[] }>("/api/buzz/sales/intake?page=0&size=5").then((r) => { if (r.data) setLeads(r.data.content ?? []); });
    apiGet<{ content: Managed[] }>("/api/buzz/sales/managed?page=0&size=200").then((r) => { if (r.data) setManaged(r.data.content ?? []); });
  }, []);

  useEffect(() => {
    apiGet<Dash>("/api/buzz/dashboard?as=manager").then((r) => { if (r.data) setDash(r.data); });
    apiGet<{ managerCenters?: MCenter[] }>("/api/user/me").then((r) => { if (r.data?.managerCenters) setCenters(r.data.managerCenters); });
    apiGet<{ content: Prod[] }>("/api/buzz/products?as=manager&page=0&size=6").then((r) => { if (r.data) setEduDone(r.data.content ?? []); });
    apiGet<{ content: EduRow[] }>("/api/buzz/education").then((r) => { if (r.data) setEduTodo((r.data.content ?? []).slice(0, 6)); });
    apiGet<{ content: Notice[] }>("/api/my/notices?page=0&size=2&as=manager").then((r) => { if (r.data) setNotices(r.data.content ?? []); });
    loadLeads();
  }, [loadLeads]);

  // 관할 구역 (승인된 활동센터명)
  const region = centers.filter((c) => c.status === "Y").map((c) => c.centerName).filter(Boolean).join(" / ") || "관할 지역 미지정";

  // 2차 영업 5단계 카운트
  const stageCount = (statuses: string[]) => managed.filter((m) => statuses.includes(m.status ?? "")).length;

  // 자동배정 토글
  async function toggleAuto(id: number, next: boolean) {
    setEduDone((rs) => rs.map((p) => (p.id === id ? { ...p, autoAssign: next } : p)));
    const r = await apiPost<{ autoAssign: boolean }>(`/api/buzz/products/${id}/auto-assign`, { autoAssign: next });
    if (!r.ok) setEduDone((rs) => rs.map((p) => (p.id === id ? { ...p, autoAssign: !next } : p)));
  }

  // 즉시 배정받기(수락) → 2차영업관리로 이동
  async function accept(lead: Lead) {
    setBusy(lead.id); setMsg(null);
    const r = await apiPost<{ message?: string }>(`/api/buzz/sales/${lead.id}/assign`, {});
    setBusy(null);
    if (r.ok) { setMsg("리드를 배정받았습니다. 2차영업관리로 이동합니다."); router.push("/buzz/managed"); }
    else setMsg(r.message ?? "배정에 실패했습니다.");
  }

  return (
    <div className="space-y-5">
      {/* 1. 환영 / 수당 요약 헤더 */}
      <div className={theme.card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-lg font-black ${theme.cardHead}`}>🙋 {name ? `${name}님` : "매니저님"}, 반갑습니다!</p>
            <p className={`mt-1 text-sm font-semibold ${theme.cardSub}`}>관할 구역: <b className={theme.accent}>{region}</b></p>
          </div>
          <Link href="/buzz/profile" className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${theme.outlineBtn}`}>내 프로필 &gt;</Link>
        </div>
      </div>

      {/* 수당 요약 카드 (이번 달 예정 CP 좌 / 출금 가능 확정 MP 우) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`rounded-2xl p-5 shadow-sm ${theme.cpCard}`}>
          <p className={`text-xs font-semibold ${theme.cpLabel}`}>이번 달 예정 수당 (CP)</p>
          <p className="mt-2 text-3xl font-black">{krw(dash.cp)}</p>
          <p className={`mt-1 text-xs ${theme.cpLabel}`}>진행 중인 2차 영업 성공 시 예상 수당</p>
        </div>
        <Link href="/buzz/allowances" className={`block rounded-2xl p-5 shadow-sm transition-transform hover:-translate-y-0.5 ${theme.mpCard}`}>
          <p className="text-xs font-bold">출금 가능 확정 수당 (MP)</p>
          <p className="mt-2 text-3xl font-black">{krw(dash.cumulativeMp)}</p>
          <p className="mt-2 text-xs font-semibold opacity-90">실사·계약 최종 승인 · [수당현황 / 정산현황]에서 확인 &gt;</p>
        </Link>
      </div>

      {/* 2. 관리매니저 활동 가이드 — 제목 옆 ⓘ 버튼=가이드 팝업, 우측 접기/열기=카드 본문 토글 */}
      <Card
        title={
          <span className="inline-flex items-center gap-2">
            관리매니저 활동 가이드
            <button onClick={() => setGuideOpen(true)} title="관리매니저 핵심 활동 가이드 보기" aria-label="핵심 활동 가이드"
              className={`grid h-6 w-6 place-items-center rounded-full text-sm font-black ${theme.outlineBtn}`}>?</button>
          </span>
        }
        sub="교육 ▸ 자동배정 ▸ 1차접수 배정 ▸ 2차영업 이행"
        right={
          <button onClick={() => setGuideCollapsed((v) => !v)} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${theme.outlineBtn}`}>
            {guideCollapsed ? "열기" : "접기"}
          </button>
        }>
        {!guideCollapsed && (
          <div className="flex flex-wrap items-center gap-2">
            {["Step1. 교육이수", "Step2. 자동배정 설정", "Step3. 1차배정", "Step4. 2차현장이행"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className={`rounded-lg border px-3 py-2 text-xs font-bold ${theme.tableWrap} ${theme.cellMain}`}>{s}</span>
                {i < 3 && <span className={theme.cellSub}>→</span>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 3. 관할 지역 신규 1차 접수 리드 */}
      <Card title="관할 지역 신규 1차 접수 리드" sub="버즈회원이 접수한 관할 지역의 신규 리드 (선착순/자동배정)"
        right={<Link href="/buzz/intake" className={`text-sm font-bold ${theme.accent}`}>영업관리 &gt;</Link>}>
        {leads.length === 0 ? (
          <p className={`py-6 text-center text-sm ${theme.note}`}>배정 대기 중인 신규 리드가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {leads.map((l) => (
              <li key={l.id} className={`rounded-xl border p-3 ${theme.tableWrap}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${theme.cellMain}`}>
                      <span className="text-red-500">●</span> [{l.centerName ?? "-"}] {l.customerName ?? "-"}
                      {l.productName ? <span className={`ml-1 font-normal ${theme.cellSub}`}>· {l.productName}</span> : null}
                    </p>
                    <p className={`mt-0.5 text-xs ${theme.cellSub}`}>
                      접수 {l.createdAt ?? "-"} · 버즈회원 {maskName(l.buzzName ?? "")} · <span className="text-amber-500">매니저 미배정</span>
                    </p>
                  </div>
                  {l.eduApproved ? (
                    <button onClick={() => accept(l)} disabled={busy === l.id}
                      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${theme.primaryBtn} disabled:opacity-50`}>
                      {busy === l.id ? "배정 중…" : "⚡ 지금 즉시 배정받기 (수락)"}
                    </button>
                  ) : (
                    <Link href="/buzz/education" className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${theme.outlineBtn}`}>교육 이수 후 배정 가능</Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {msg && <p className={`mt-3 text-sm font-semibold ${theme.accent}`}>{msg}</p>}
      </Card>

      {/* 4. 진행 중인 2차 영업 관리 */}
      <Card title="진행 중인 2차 영업 관리" sub="상담·현장방문·실사·계약 진행이 필요한 내 배정 리드"
        right={<Link href="/buzz/managed" className={`text-sm font-bold ${theme.accent}`}>2차영업관리 &gt;</Link>}>
        <div className="flex flex-wrap items-stretch justify-center gap-2">
          {STAGE_MAP.map((s, i) => (
            <div key={s.label} className="flex items-stretch gap-2">
              <Link href="/buzz/managed" className={`flex min-w-[92px] flex-col items-center justify-center rounded-xl border px-3 py-3 transition-transform hover:-translate-y-0.5 ${theme.tableWrap}`}>
                <span className={`text-xs font-semibold ${theme.cellSub}`}>{s.label}</span>
                <span className={`mt-1 text-2xl font-black ${theme.cellMain}`}>{stageCount(s.statuses)}<span className="text-xs font-semibold">건</span></span>
              </Link>
              {i < STAGE_MAP.length - 1 && <span className={`self-center text-lg ${theme.cellSub}`}>→</span>}
            </div>
          ))}
        </div>
        {/* 모바일 전용: 클릭 시 폰 카메라 실행(capture) → 촬영 후 실사 리포트 페이지로. PC(≥sm)에서는 미노출 (docs/23_1) */}
        <label className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold sm:hidden ${theme.primaryBtn}`}>
          📸 실사 리포트 및 사진 작성하기
          <input type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { if (e.target.files && e.target.files.length > 0) router.push("/buzz/managed"); }} />
        </label>
      </Card>

      {/* 5. 이수 필요/추천 관리 상품 */}
      <Card title="이수 필요 / 추천 관리 상품" sub="교육을 이수해야 해당 상품의 리드를 배정받을 수 있습니다"
        right={<Link href="/buzz/education" className={`text-sm font-bold ${theme.accent}`}>교육관리 &gt;</Link>}>
        <div className="grid gap-3 sm:grid-cols-2">
          {eduDone.slice(0, 4).map((p) => (
            <div key={`d${p.id}`} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${theme.tableWrap}`}>
              <span className="min-w-0">
                <span className={`block truncate text-sm font-bold ${theme.cellMain}`}>{p.name}</span>
                <span className="text-xs text-emerald-500">🟢 교육 이수 완료</span>
              </span>
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs">
                <span className={theme.cellSub}>자동배정</span>
                <button type="button" onClick={() => toggleAuto(p.id, !p.autoAssign)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${p.autoAssign ? "bg-emerald-500" : "bg-slate-500/50"}`} aria-pressed={p.autoAssign}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${p.autoAssign ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </label>
            </div>
          ))}
          {eduTodo.slice(0, 4).map((p) => (
            <div key={`t${p.productId}`} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${theme.tableWrap}`}>
              <span className="min-w-0">
                <span className={`block truncate text-sm font-bold ${theme.cellMain}`}>{p.productName}</span>
                <span className="text-xs text-red-500">🔴 미이수 (수강 필요)</span>
              </span>
              <Link href="/buzz/education" className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${theme.outlineBtn}`}>🎓 10분 교육 수강</Link>
            </div>
          ))}
          {eduDone.length === 0 && eduTodo.length === 0 && <p className={`col-span-full py-6 text-center text-sm ${theme.note}`}>표시할 상품이 없습니다.</p>}
        </div>
      </Card>

      {/* 6. 공지사항 & 업무 알림 */}
      <Card title="공지사항 & 업무 알림" sub="프로모션 이벤트 및 업무 지침 안내"
        right={<Link href="/buzz/notices" className={`text-sm font-bold ${theme.accent}`}>더보기 &gt;</Link>}>
        {notices.length === 0 ? (
          <p className={`py-6 text-center text-sm ${theme.note}`}>등록된 공지사항이 없습니다.</p>
        ) : (
          <ul className={`divide-y ${theme.divide}`}>
            {notices.slice(0, 2).map((n) => (
              <li key={n.id}>
                <Link href="/buzz/notices" className={`flex items-center justify-between gap-3 py-3 ${theme.rowHover}`}>
                  <span className={`truncate text-sm font-semibold ${theme.cellMain}`}>{n.title}</span>
                  <span className={`shrink-0 text-xs ${theme.cellSub}`}>{(n.createdAt ?? "").slice(0, 10)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 활동 가이드 팝업 (docs/23 Task4) — 뷰포트 정중앙 */}
      {guideOpen && createPortal(
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onClick={() => setGuideOpen(false)}>
          <div className={`max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl ${theme.card}`} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`text-lg font-black ${theme.cardHead}`}>관리매니저 핵심 활동 가이드 (4-Step)</h3>
              <button onClick={() => setGuideOpen(false)} className={`text-sm ${theme.cellSub} hover:opacity-70`} aria-label="닫기">✕</button>
            </div>
            <ol className="space-y-3">
              {GUIDE.map((g) => (
                <li key={g.step} className={`rounded-xl border p-3.5 ${theme.tableWrap}`}>
                  <p className={`text-sm font-black ${theme.cellMain}`}>{g.step}. [{g.menu}]</p>
                  <p className={`mt-1 text-sm leading-relaxed ${theme.cellSub}`}>{g.desc}</p>
                </li>
              ))}
            </ol>
            <button onClick={() => setGuideOpen(false)} className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-bold ${theme.primaryBtn}`}>확인</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
