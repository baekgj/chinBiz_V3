"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { apiGet, apiPost, apiPut } from "@/lib/api";

/**
 * 본사 [시스템설정]-[알림톡설정] (docs/35)
 *  ① 알리고 연동 계정  ② 이벤트별 발송 문구(현재: 1차영업신청 접수 → 가망고객 대표자)  ③ 테스트 발송  ④ 발송 이력
 *  BE: /api/org/alimtalk/*
 */

type Config = { apikeyMasked: string; apikeySet: boolean; userid: string; senderkey: string; sender: string; testMode: string; ready: boolean };
type Btn = { name: string; linkType: string; linkMo: string; linkPc: string };
type Tpl = {
  eventCode: string; eventName: string; enabled: string; tplCode: string; subject: string; message: string;
  buttonJson: string | null; failover: string; fsubject: string; fmessage: string; updatedAt: string | null;
};
type Var = { key: string; desc: string };
type AligoTpl = { tplCode: string; name: string; content: string; title: string; inspStatus: string; status: string; buttons: Btn[] };
type Log = {
  id: number; eventCode: string; refId: number | null; receiver: string; recvName: string; tplCode: string; message: string;
  result: string; resultCode: string | null; resultMessage: string | null; testMode: string; createdAt: string;
};

const inputCls = "w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500";
const labelCls = "mb-1 block text-xs font-semibold text-slate-400";
const btnCls = "rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60";
const subBtnCls = "rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-brand-500 hover:text-white disabled:opacity-60";

const LINK_TYPES = [
  { v: "WL", l: "웹링크" },
  { v: "AC", l: "채널 추가" },
  { v: "DS", l: "배송조회" },
];
const EVENT_CODE = "SALE1_CUSTOMER";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="inline-flex items-center gap-2 text-sm text-slate-300">
      <span className={`relative h-5 w-9 rounded-full transition ${on ? "bg-brand-500" : "bg-slate-600"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

const render = (text: string, sample: Record<string, string>) =>
  Object.entries(sample).reduce((acc, [k, v]) => acc.split(k).join(v), text || "");

const parseBtns = (json: string | null): Btn[] => {
  try {
    const a = JSON.parse(json || "[]");
    return Array.isArray(a) ? a.map((b) => ({ name: b.name || "", linkType: b.linkType || "WL", linkMo: b.linkMo || "", linkPc: b.linkPc || "" })) : [];
  } catch { return []; }
};

export default function AlimtalkSettings() {
  // ① 계정
  const [cfg, setCfg] = useState<Config | null>(null);
  const [apikey, setApikey] = useState("");
  const [cfgMsg, setCfgMsg] = useState<string | null>(null);
  const [remain, setRemain] = useState<string | null>(null);

  // ② 문구
  const [tpl, setTpl] = useState<Tpl | null>(null);
  const [btns, setBtns] = useState<Btn[]>([]);
  const [vars, setVars] = useState<Var[]>([]);
  const [sample, setSample] = useState<Record<string, string>>({});
  const [tplMsg, setTplMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const [aligoList, setAligoList] = useState<AligoTpl[] | null>(null);
  const [aligoErr, setAligoErr] = useState<string | null>(null);

  // ③ 테스트 / ④ 이력
  const [testTo, setTestTo] = useState("");
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [openLog, setOpenLog] = useState<number | null>(null);

  const loadLogs = useCallback(async (p: number) => {
    const r = await apiGet<{ content: Log[]; totalPages: number }>(`/api/org/alimtalk/logs?page=${p}&size=10`);
    if (r.ok && r.data) { setLogs(r.data.content); setTotalPages(r.data.totalPages); setPage(p); }
  }, []);

  useEffect(() => {
    apiGet<Config>("/api/org/alimtalk/config").then((r) => { if (r.ok && r.data) setCfg(r.data); });
    apiGet<{ templates: Tpl[]; vars: Var[]; sample: Record<string, string> }>("/api/org/alimtalk/templates").then((r) => {
      if (r.ok && r.data) {
        const t = r.data.templates.find((x) => x.eventCode === EVENT_CODE) || r.data.templates[0] || null;
        setTpl(t); setBtns(parseBtns(t?.buttonJson ?? null)); setVars(r.data.vars); setSample(r.data.sample);
      }
    });
    loadLogs(0);
  }, [loadLogs]);

  // ── ① 계정 저장 ──
  async function saveConfig() {
    if (!cfg) return;
    setCfgMsg(null);
    const r = await apiPut<{ message: string }>("/api/org/alimtalk/config", {
      apikey, userid: cfg.userid, senderkey: cfg.senderkey, sender: cfg.sender, testMode: cfg.testMode,
    });
    setCfgMsg(r.ok ? "저장되었습니다." : r.message || "저장 실패");
    if (r.ok) {
      setApikey("");
      const c = await apiGet<Config>("/api/org/alimtalk/config");
      if (c.ok && c.data) setCfg(c.data);
    }
  }

  async function loadRemain() {
    setRemain("조회 중…");
    const r = await apiGet<{ list?: Record<string, unknown> }>("/api/org/alimtalk/remain");
    if (!r.ok) { setRemain(r.message || "조회 실패"); return; }
    const l = r.data?.list || {};
    setRemain(Object.entries(l).map(([k, v]) => `${k} ${Number(v).toLocaleString("ko-KR")}건`).join(" · ") || "응답 없음");
  }

  // ── ② 문구 ──
  const setT = <K extends keyof Tpl>(k: K, v: Tpl[K]) => setTpl((p) => (p ? { ...p, [k]: v } : p));

  function insertVar(key: string) {
    if (!tpl) return;
    const el = msgRef.current;
    const s = el?.selectionStart ?? tpl.message.length;
    const e = el?.selectionEnd ?? s;
    const next = (tpl.message || "").slice(0, s) + key + (tpl.message || "").slice(e);
    setT("message", next);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(s + key.length, s + key.length); });
  }

  const setBtn = (i: number, k: keyof Btn, v: string) => setBtns((p) => p.map((b, idx) => (idx === i ? { ...b, [k]: v } : b)));

  async function saveTpl() {
    if (!tpl) return;
    setSaving(true); setTplMsg(null);
    const r = await apiPut<{ message: string }>(`/api/org/alimtalk/templates/${tpl.eventCode}`, {
      enabled: tpl.enabled, tplCode: tpl.tplCode, subject: tpl.subject, message: tpl.message,
      buttonJson: btns.length ? JSON.stringify(btns.filter((b) => b.name.trim())) : "",
      failover: tpl.failover, fsubject: tpl.fsubject, fmessage: tpl.fmessage,
    });
    setSaving(false);
    setTplMsg(r.ok ? "저장되었습니다." : r.message || "저장 실패");
  }

  async function openAligo() {
    setAligoErr(null); setAligoList([]);
    const r = await apiGet<{ list: AligoTpl[] }>("/api/org/alimtalk/aligo-templates");
    if (r.ok && r.data) setAligoList(r.data.list);
    else { setAligoList(null); setAligoErr(r.message || "불러오기 실패"); }
  }

  function applyAligo(a: AligoTpl) {
    setTpl((p) => (p ? { ...p, tplCode: a.tplCode, message: a.content, subject: p.subject || a.name } : p));
    setBtns(a.buttons.map((b) => ({ ...b })));
    setAligoList(null);
    setTplMsg("템플릿을 불러왔습니다. [저장]을 눌러 반영하세요.");
  }

  // ── ③ 테스트 ──
  async function sendTest() {
    setTesting(true); setTestMsg(null);
    const r = await apiPost<Log>("/api/org/alimtalk/test", { eventCode: tpl?.eventCode, receiver: testTo });
    setTesting(false);
    if (!r.ok || !r.data) { setTestMsg(r.message || "발송 실패"); return; }
    const d = r.data;
    setTestMsg(d.result === "SUCCESS" ? `발송 성공${d.testMode === "Y" ? " (테스트모드 — 실제 수신 없음)" : ""}`
      : d.result === "SKIP" ? `미발송: ${d.resultMessage}` : `발송 실패: ${d.resultMessage} (code ${d.resultCode})`);
    loadLogs(0);
  }

  const resultBadge = (r: string) =>
    r === "SUCCESS" ? <Badge tone="pos">성공</Badge> : r === "SKIP" ? <Badge tone="warn">미발송</Badge> : <Badge tone="danger">실패</Badge>;

  return (
    <div className="animate-float-up space-y-5">
      {/* ① 알리고 연동 계정 */}
      <Card>
        <SectionTitle
          title="알리고 연동 계정"
          sub="카카오 알림톡 발송 대행사(알리고) API 정보를 입력합니다. 알리고 관리페이지에서 API Key 발급 · 발송 서버 IP 등록이 필요합니다."
          right={cfg && (cfg.ready ? <Badge tone="pos">연동 준비됨</Badge> : <Badge tone="warn">설정 필요</Badge>)}
        />
        {cfg && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>API Key {cfg.apikeySet && <span className="text-slate-500">(저장됨: {cfg.apikeyMasked} · 변경 시에만 입력)</span>}</label>
                <input type="password" autoComplete="new-password" value={apikey} onChange={(e) => setApikey(e.target.value)}
                  placeholder={cfg.apikeySet ? "변경하지 않으려면 비워두세요" : "알리고 API Key"} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>알리고 사용자 ID</label>
                <input value={cfg.userid} onChange={(e) => setCfg({ ...cfg, userid: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>발신프로필키 (senderkey · 카카오 채널 연동 후 발급)</label>
                <input value={cfg.senderkey} onChange={(e) => setCfg({ ...cfg, senderkey: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>발신번호 (알리고에 등록된 번호)</label>
                <input value={cfg.sender} onChange={(e) => setCfg({ ...cfg, sender: e.target.value })} placeholder="0264120505" className={inputCls} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Toggle on={cfg.testMode === "Y"} onChange={(v) => setCfg({ ...cfg, testMode: v ? "Y" : "N" })}
                label="테스트모드 (알리고 testMode=Y · 실제 발송/과금 없음)" />
              <button onClick={loadRemain} className={subBtnCls}>잔여 건수 조회</button>
              {remain && <span className="text-xs text-slate-400">{remain}</span>}
              <div className="ml-auto flex items-center gap-3">
                {cfgMsg && <span className="text-sm font-semibold text-brand-300">{cfgMsg}</span>}
                <button onClick={saveConfig} className={btnCls}>계정 저장</button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ② 발송 문구 */}
      {tpl && (
        <Card>
          <SectionTitle
            title="알림톡 발송 문구"
            sub="카카오 검수 승인된 알리고 템플릿과 본문·버튼이 동일해야 발송됩니다. #{변수}는 발송 시 실제 값으로 치환됩니다."
            right={<Toggle on={tpl.enabled === "Y"} onChange={(v) => setT("enabled", v ? "Y" : "N")} label={tpl.enabled === "Y" ? "발송 사용" : "발송 중지"} />}
          />

          <div className="mb-4 rounded-xl border border-brand-500/30 bg-navy-900/60 px-4 py-3 text-sm">
            <span className="font-bold text-brand-300">발송 시점</span>
            <span className="ml-3 text-slate-300">버즈admin [1차영업신청] 접수 → 가망고객 <b className="text-white">대표자 핸드폰</b></span>
            <span className="ml-2 text-xs text-slate-500">({tpl.eventCode})</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>템플릿 코드 (tpl_code)</label>
                  <div className="flex gap-2">
                    <input value={tpl.tplCode || ""} onChange={(e) => setT("tplCode", e.target.value)} placeholder="예) TA_1234" className={inputCls} />
                    <button onClick={openAligo} className={`${subBtnCls} shrink-0`}>알리고 템플릿 불러오기</button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>알림톡 제목 (관리용)</label>
                  <input value={tpl.subject || ""} onChange={(e) => setT("subject", e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>본문 ({(tpl.message || "").length.toLocaleString()}자 / 최대 1,000자)</label>
                <textarea ref={msgRef} rows={11} value={tpl.message || ""} maxLength={1000}
                  onChange={(e) => setT("message", e.target.value)} className={`${inputCls} font-mono leading-relaxed`} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {vars.map((v) => (
                    <button key={v.key} type="button" onClick={() => insertVar(v.key)} title={v.desc}
                      className="rounded-md bg-brand-500/10 px-2 py-1 text-xs font-semibold text-brand-300 ring-1 ring-brand-500/30 hover:bg-brand-500/20">
                      {v.key}
                    </button>
                  ))}
                  <span className="self-center text-xs text-slate-500">클릭하면 커서 위치에 삽입</span>
                </div>
              </div>

              {/* 버튼 */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className={labelCls}>버튼 (최대 5개 · 링크에 #{"{상품링크}"} 사용 가능)</label>
                  <button type="button" disabled={btns.length >= 5}
                    onClick={() => setBtns((p) => [...p, { name: "", linkType: "WL", linkMo: "", linkPc: "" }])} className={subBtnCls}>+ 버튼 추가</button>
                </div>
                {btns.length === 0 && <p className="text-xs text-slate-500">버튼 없음</p>}
                <div className="space-y-2">
                  {btns.map((b, i) => (
                    <div key={i} className="grid gap-2 rounded-lg bg-navy-800 p-3 md:grid-cols-[110px_1fr_1fr_1fr_auto]">
                      <select value={b.linkType} onChange={(e) => setBtn(i, "linkType", e.target.value)} className={inputCls}>
                        {LINK_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                      </select>
                      <input value={b.name} onChange={(e) => setBtn(i, "name", e.target.value)} placeholder="버튼명" className={inputCls} />
                      <input value={b.linkMo} disabled={b.linkType !== "WL"} onChange={(e) => setBtn(i, "linkMo", e.target.value)} placeholder="모바일 링크" className={inputCls} />
                      <input value={b.linkPc} disabled={b.linkType !== "WL"} onChange={(e) => setBtn(i, "linkPc", e.target.value)} placeholder="PC 링크(선택)" className={inputCls} />
                      <button type="button" onClick={() => setBtns((p) => p.filter((_, idx) => idx !== i))} className="px-2 text-xs font-semibold text-danger">삭제</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 대체문자 */}
              <div className="rounded-xl bg-navy-800 p-4">
                <Toggle on={tpl.failover === "Y"} onChange={(v) => setT("failover", v ? "Y" : "N")}
                  label="알림톡 실패 시 문자(SMS/LMS)로 대체 발송" />
                {tpl.failover === "Y" && (
                  <div className="mt-3 grid gap-3">
                    <input value={tpl.fsubject || ""} onChange={(e) => setT("fsubject", e.target.value)} placeholder="대체문자 제목(LMS)" className={inputCls} />
                    <textarea rows={3} value={tpl.fmessage || ""} onChange={(e) => setT("fmessage", e.target.value)}
                      placeholder="비워두면 알림톡 본문으로 대체 발송" className={inputCls} />
                  </div>
                )}
              </div>
            </div>

            {/* 미리보기 */}
            <div>
              <p className={labelCls}>미리보기 (샘플 값 치환)</p>
              <div className="rounded-2xl bg-[#abc1d1] p-4">
                <div className="mb-1 text-xs font-bold text-slate-700">친비즈</div>
                <div className="overflow-hidden rounded-xl bg-white text-slate-900 shadow">
                  <div className="bg-[#fee500] px-3 py-2 text-xs font-bold">알림톡 도착</div>
                  <div className="whitespace-pre-wrap break-all px-3 py-3 text-[13px] leading-relaxed">
                    {render(tpl.message, sample) || <span className="text-slate-400">본문을 입력하세요</span>}
                  </div>
                  {btns.filter((b) => b.name.trim()).map((b, i) => (
                    <div key={i} className="mx-3 mb-2 rounded-md bg-slate-100 py-2 text-center text-[13px] font-semibold">{b.name}</div>
                  ))}
                  <div className="h-1" />
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-slate-500">
                {vars.map((v) => <li key={v.key}><span className="text-brand-300">{v.key}</span> {v.desc}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            {tplMsg && <span className="text-sm font-semibold text-brand-300">{tplMsg}</span>}
            <button onClick={saveTpl} disabled={saving} className={btnCls}>{saving ? "저장 중…" : "문구 저장"}</button>
          </div>
        </Card>
      )}

      {/* ③ 테스트 발송 */}
      <Card>
        <SectionTitle title="테스트 발송" sub="저장된 문구를 샘플 값으로 치환해 입력한 번호로 발송합니다. (발송 사용 상태 + 계정 설정 완료 시)" />
        <div className="flex flex-wrap items-center gap-3">
          <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="수신 핸드폰번호 (010-0000-0000)" className={`${inputCls} max-w-xs`} />
          <button onClick={sendTest} disabled={testing} className={btnCls}>{testing ? "발송 중…" : "테스트 발송"}</button>
          {testMsg && <span className="text-sm font-semibold text-brand-300">{testMsg}</span>}
        </div>
      </Card>

      {/* ④ 발송 이력 */}
      <Card>
        <SectionTitle title="발송 이력" sub="성공 · 실패 · 미발송(설정 미비) 모두 기록됩니다. 수신번호는 마스킹 표시." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-slate-500">
                <th className="py-2">일시</th><th>구분</th><th>영업ID</th><th>수신</th><th>템플릿</th><th>결과</th><th>내용</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">발송 이력이 없습니다.</td></tr>}
              {logs.map((l) => (
                <Fragment key={l.id}>
                  <tr onClick={() => setOpenLog(openLog === l.id ? null : l.id)} className="cursor-pointer border-b border-line/50 text-slate-300 hover:bg-navy-800/60">
                    <td className="py-2 whitespace-nowrap">{(l.createdAt || "").replace("T", " ").slice(0, 16)}</td>
                    <td>{l.refId == null ? "테스트" : "1차영업 접수"}{l.testMode === "Y" && <span className="ml-1 text-xs text-warn">(T)</span>}</td>
                    <td>{l.refId ?? "-"}</td>
                    <td className="whitespace-nowrap">{l.recvName ? `${l.recvName} ` : ""}{l.receiver}</td>
                    <td>{l.tplCode || "-"}</td>
                    <td>{resultBadge(l.result)}</td>
                    <td className="max-w-[260px] truncate text-xs text-slate-400">{l.resultMessage}</td>
                  </tr>
                  {openLog === l.id && (
                    <tr className="border-b border-line/50">
                      <td colSpan={7} className="whitespace-pre-wrap bg-navy-900/60 px-3 py-3 text-xs text-slate-300">{l.message || "(본문 없음)"}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="mt-3 flex justify-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => loadLogs(i)}
                className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold ${i === page ? "bg-brand-600 text-white" : "text-slate-400 hover:bg-navy-800"}`}>{i + 1}</button>
            ))}
          </div>
        )}
      </Card>

      {/* 알리고 템플릿 선택 모달 */}
      {(aligoList || aligoErr) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setAligoList(null); setAligoErr(null); }}>
          <div className="card max-h-[80vh] w-full max-w-2xl overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <SectionTitle title="알리고 템플릿 불러오기" sub="승인(APR)된 템플릿을 선택하면 코드·본문·버튼이 채워집니다." />
            {aligoErr && <p className="text-sm text-danger">{aligoErr}</p>}
            {aligoList && aligoList.length === 0 && !aligoErr && <p className="text-sm text-slate-500">불러오는 중이거나 등록된 템플릿이 없습니다.</p>}
            <div className="space-y-2">
              {aligoList?.map((a) => (
                <button key={a.tplCode} onClick={() => applyAligo(a)} className="block w-full rounded-xl bg-navy-800 p-3 text-left hover:ring-1 hover:ring-brand-500">
                  <div className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
                    {a.name} <span className="text-xs text-slate-500">{a.tplCode}</span>
                    {a.inspStatus === "APR" ? <Badge tone="pos">승인</Badge> : <Badge tone="warn">{a.inspStatus || "미승인"}</Badge>}
                  </div>
                  <p className="line-clamp-3 whitespace-pre-wrap text-xs text-slate-400">{a.content}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button onClick={() => { setAligoList(null); setAligoErr(null); }} className={subBtnCls}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
