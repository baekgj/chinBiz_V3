"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiUpload } from "@/lib/api";

type Props = {
  value: string;
  onChange: (html: string) => void;
  theme?: "dark" | "light";
  placeholder?: string;
  minHeight?: number;
};

type Tool = { cmd: string; arg?: string; label: string; title: string };
const TOOLS: Tool[] = [
  { cmd: "bold", label: "B", title: "굵게" },
  { cmd: "italic", label: "I", title: "기울임" },
  { cmd: "underline", label: "U", title: "밑줄" },
  { cmd: "strikeThrough", label: "S", title: "취소선" },
  { cmd: "__divider", label: "", title: "" },
  { cmd: "fontSize", arg: "2", label: "작게", title: "작은 글씨" },
  { cmd: "fontSize", arg: "4", label: "보통", title: "보통 글씨" },
  { cmd: "fontSize", arg: "6", label: "크게", title: "큰 글씨" },
  { cmd: "formatBlock", arg: "h2", label: "H2", title: "제목2" },
  { cmd: "formatBlock", arg: "h3", label: "H3", title: "제목3" },
  { cmd: "formatBlock", arg: "p", label: "본문", title: "본문" },
  { cmd: "formatBlock", arg: "blockquote", label: "❝ 인용", title: "인용구" },
  { cmd: "__divider", label: "", title: "" },
  { cmd: "insertUnorderedList", label: "• 목록", title: "글머리 목록" },
  { cmd: "insertOrderedList", label: "1. 목록", title: "번호 목록" },
  { cmd: "justifyLeft", label: "⯇", title: "왼쪽 정렬" },
  { cmd: "justifyCenter", label: "≡", title: "가운데 정렬" },
  { cmd: "justifyRight", label: "⯈", title: "오른쪽 정렬" },
  { cmd: "insertHorizontalRule", label: "─", title: "구분선" },
];
const PRESETS = [{ label: "25%", w: "25%" }, { label: "50%", w: "50%" }, { label: "75%", w: "75%" }, { label: "원본", w: "100%" }];
type Box = { l: number; t: number; w: number; h: number; pct: number };

/**
 * 상품설명 리치 텍스트 에디터 — 서식 + 본문 이미지 업로드 + 이미지 크기 조절.
 * 이미지 클릭 → 선택(파란 테두리) → 프리셋(25/50/75/100%)·슬라이더·모서리 드래그로 크기 조절.
 * 이미지는 /api/uploads 업로드 후 <img> 삽입, 크기는 style.width 로 HTML 에 영속.
 */
export default function RichTextEditor({ value, onChange, theme = "light", placeholder = "내용을 입력하세요", minHeight = 220 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const imgFileRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const selRef = useRef<HTMLImageElement | null>(null);
  const armed = useRef(false); // 툴바 버튼 실제 mousedown 여부 (에디터 클릭이 첫 버튼 onClick을 유발하는 현상 차단)
  const inited = useRef(false);
  const [empty, setEmpty] = useState(!value || value === "<br>");
  const [uploading, setUploading] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const [htmlMode, setHtmlMode] = useState(false); // HTML 코드 직접 편집 모드

  const isEmpty = (html: string) => html.replace(/<br\s*\/?>/gi, "").replace(/<img[^>]*>/gi, "IMG").replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, "").trim() === "";

  const sync = useCallback(() => {
    if (!ref.current) return;
    setEmpty(isEmpty(ref.current.innerHTML));
    onChange(ref.current.innerHTML);
  }, [onChange]);

  const measure = useCallback(() => {
    const img = selRef.current;
    if (!img || !ref.current) { setBox(null); return; }
    const cw = ref.current.clientWidth || img.offsetWidth || 1;
    setBox({ l: img.offsetLeft, t: img.offsetTop, w: img.offsetWidth, h: img.offsetHeight, pct: Math.round((img.offsetWidth / cw) * 100) });
  }, []);

  const selectImage = useCallback((img: HTMLImageElement | null) => {
    ref.current?.querySelectorAll("img.rte-img-sel").forEach((el) => el.classList.remove("rte-img-sel"));
    selRef.current = img;
    if (img) img.classList.add("rte-img-sel");
    measure();
  }, [measure]);

  // 최초 1회 초기값 주입
  useEffect(() => {
    if (ref.current && !inited.current) { ref.current.innerHTML = value || ""; inited.current = true; setEmpty(isEmpty(ref.current.innerHTML)); }
  }, [value]);

  // HTML 코드 모드 → 서식 모드 복귀 시, 편집된 최신 HTML을 에디터에 재주입
  useEffect(() => {
    if (!htmlMode && ref.current) { ref.current.innerHTML = value || ""; setEmpty(isEmpty(ref.current.innerHTML)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlMode]);

  // 이미지 선택/해제는 네이티브 리스너로 (React 합성이벤트 간섭 회피)
  useEffect(() => {
    const ed = ref.current;
    if (!ed) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "IMG") selectImage(t as HTMLImageElement);
      else selectImage(null);
    };
    ed.addEventListener("click", onClick);
    return () => ed.removeEventListener("click", onClick);
  }, [selectImage]);

  const saveSel = () => {
    const s = window.getSelection();
    if (s && s.rangeCount && ref.current && ref.current.contains(s.anchorNode)) savedRange.current = s.getRangeAt(0).cloneRange();
  };
  const restoreSel = () => {
    const s = window.getSelection();
    if (!s || !ref.current) return;
    ref.current.focus();
    s.removeAllRanges();
    if (savedRange.current && ref.current.contains(savedRange.current.commonAncestorContainer)) s.addRange(savedRange.current);
    else { const r = document.createRange(); r.selectNodeContents(ref.current); r.collapse(false); s.addRange(r); }
  };

  const exec = (t: Tool) => { if (!armed.current) return; armed.current = false; selectImage(null); ref.current?.focus(); document.execCommand(t.cmd, false, t.arg); sync(); };
  const addLink = () => { const url = window.prompt("링크 URL", "https://"); if (!url) return; ref.current?.focus(); document.execCommand("createLink", false, url); sync(); };
  const clearFmt = () => { ref.current?.focus(); document.execCommand("removeFormat", false); document.execCommand("formatBlock", false, "p"); sync(); };
  const applyColor = (cmd: string, val: string) => { restoreSel(); document.execCommand(cmd, false, val); sync(); };

  async function onPickImage(list: FileList | null) {
    const file = list?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const res = await apiUpload<{ url: string }>("/api/uploads", file);
    setUploading(false);
    if (res.ok && res.data?.url) { restoreSel(); document.execCommand("insertHTML", false, `<img src="${res.data.url}" alt="상품 설명 이미지" />`); sync(); }
  }

  const applyWidth = (w: string) => { const img = selRef.current; if (!img) return; img.style.width = w; img.style.height = "auto"; measure(); sync(); };
  const applyPx = (px: number) => { const img = selRef.current; if (!img || !ref.current) return; const nw = Math.max(40, Math.min(px, ref.current.clientWidth - 8)); img.style.width = `${nw}px`; img.style.height = "auto"; measure(); };
  const onHandleDown = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const img = selRef.current; if (!img) return;
    const startX = e.clientX, startW = img.offsetWidth;
    const move = (ev: PointerEvent) => applyPx(startW + (ev.clientX - startX));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); sync(); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };

  const dark = theme === "dark";
  const wrap = dark ? "rounded-lg border border-line bg-navy-950" : "rounded-lg border border-slate-300 bg-white";
  const bar = dark ? "flex flex-wrap items-center gap-1 border-b border-line bg-navy-900 px-2 py-1.5" : "flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5";
  const btn = dark ? "min-w-7 rounded px-2 py-1 text-xs font-bold text-slate-300 hover:bg-navy-800 hover:text-white" : "min-w-7 rounded px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900";
  const imgBtn = dark ? "rounded px-2 py-1 text-xs font-bold text-cyan-300 ring-1 ring-cyan-500/40 hover:bg-cyan-500/15 disabled:opacity-50" : "rounded px-2 py-1 text-xs font-bold text-sky-600 ring-1 ring-sky-300 hover:bg-sky-50 disabled:opacity-50";
  const area = dark ? "text-white" : "text-slate-900";
  const ph = dark ? "text-slate-600" : "text-slate-400";
  const divider = dark ? "mx-1 h-4 w-px bg-line" : "mx-1 h-4 w-px bg-slate-300";
  const sizeBar = dark ? "bg-navy-800 ring-1 ring-line shadow-lg" : "bg-white ring-1 ring-slate-300 shadow-lg";
  const presetBtn = dark ? "rounded px-2 py-0.5 text-[11px] font-bold text-slate-200 hover:bg-cyan-500/20" : "rounded px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:bg-sky-100";
  const codeBtnOn = dark ? "bg-brand-600 text-white" : "bg-sky-600 text-white";
  const codeBtn = htmlMode ? `rounded px-2 py-1 text-xs font-bold ${codeBtnOn}` : btn;
  const htmlArea = dark ? "bg-navy-950 text-slate-200" : "bg-white text-slate-900";

  return (
    <div className={wrap}>
      <div className={bar}>
        {!htmlMode && (
          <>
            {TOOLS.map((t, i) => (
              t.cmd === "__divider"
                ? <span key={i} className={divider} />
                : <button key={i} type="button" title={t.title} onMouseDown={(e) => { e.preventDefault(); armed.current = true; }} onClick={() => exec(t)} className={btn}>{t.label}</button>
            ))}
            <span className={divider} />
            {/* 글자색 / 배경색 */}
            <label title="글자색" onMouseDown={(e) => { e.preventDefault(); saveSel(); }} className={`${btn} flex cursor-pointer items-center gap-1`}>
              <span className="font-black">A</span>
              <input type="color" defaultValue="#e11d48" onChange={(e) => applyColor("foreColor", e.target.value)} className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0" />
            </label>
            <label title="배경색(형광펜)" onMouseDown={(e) => { e.preventDefault(); saveSel(); }} className={`${btn} flex cursor-pointer items-center gap-1`}>
              <span>🖍</span>
              <input type="color" defaultValue="#fde047" onChange={(e) => applyColor("hiliteColor", e.target.value)} className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0" />
            </label>
            <span className={divider} />
            <button type="button" title="링크" onMouseDown={(e) => e.preventDefault()} onClick={addLink} className={btn}>🔗</button>
            <button type="button" title="서식 지우기" onMouseDown={(e) => e.preventDefault()} onClick={clearFmt} className={btn}>✕서식</button>
            <span className={divider} />
            <button type="button" title="이미지 삽입" disabled={uploading}
              onMouseDown={(e) => { e.preventDefault(); saveSel(); }} onClick={() => imgFileRef.current?.click()} className={imgBtn}>
              {uploading ? "업로드 중…" : "🖼 이미지"}
            </button>
            <input ref={imgFileRef} type="file" accept="image/*" hidden onChange={(e) => { onPickImage(e.target.files); e.currentTarget.value = ""; }} />
            <span className={divider} />
          </>
        )}
        <button type="button" title={htmlMode ? "서식 편집으로 전환" : "HTML 코드 직접 편집"}
          onMouseDown={(e) => e.preventDefault()} onClick={() => setHtmlMode((m) => !m)} className={codeBtn}>
          {htmlMode ? "✎ 서식 편집" : "</> HTML"}
        </button>
      </div>

      {htmlMode ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false}
          placeholder="<h2>제목</h2><p>내용</p> 형태의 HTML 코드를 직접 작성/수정하세요"
          className={`w-full resize-y px-3 py-3 font-mono text-xs leading-relaxed outline-none ${htmlArea}`} style={{ minHeight }} />
      ) : (
      <div className="relative">
        {empty && <div className={`pointer-events-none absolute left-3 top-3 text-sm ${ph}`}>{placeholder}</div>}
        <div ref={ref} contentEditable suppressContentEditableWarning onInput={sync} onBlur={sync} onKeyUp={saveSel} onMouseUp={saveSel}
          role="textbox" aria-multiline="true" className={`rte-content px-3 py-3 text-sm leading-relaxed outline-none ${area}`} style={{ minHeight }} />

        {/* 이미지 선택 시 크기조절 오버레이 (절대위치 → 본문 레이아웃 밀지 않음) */}
        {box && (
          <div className={`absolute z-20 flex items-center gap-1 rounded-md px-1.5 py-1 ${sizeBar}`}
            style={{ left: Math.max(0, box.l), top: Math.max(0, box.t - 34) }} onMouseDown={(e) => e.preventDefault()}>
            <span className={`px-1 text-[11px] font-bold ${dark ? "text-cyan-300" : "text-sky-600"}`}>{box.pct}%</span>
            {PRESETS.map((p) => <button key={p.w} type="button" className={presetBtn} onClick={() => applyWidth(p.w)}>{p.label}</button>)}
            <input type="range" min={40} max={ref.current?.clientWidth ? ref.current.clientWidth - 8 : 800} value={box.w}
              onChange={(e) => applyPx(Number(e.target.value))} onPointerUp={sync} className="h-1 w-28 cursor-pointer" title="드래그하여 크기 조절" />
          </div>
        )}
        {box && (
          <span onPointerDown={onHandleDown} onMouseDown={(e) => e.preventDefault()}
            className="absolute z-20 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border-2 border-white bg-sky-500 shadow"
            style={{ left: box.l + box.w - 7, top: box.t + box.h - 7 }} title="드래그하여 크기 조절" />
        )}
      </div>
      )}
    </div>
  );
}
