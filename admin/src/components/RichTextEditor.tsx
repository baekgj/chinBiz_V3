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
  { cmd: "formatBlock", arg: "h2", label: "H2", title: "제목2" },
  { cmd: "formatBlock", arg: "h3", label: "H3", title: "제목3" },
  { cmd: "formatBlock", arg: "p", label: "본문", title: "본문" },
  { cmd: "insertUnorderedList", label: "• 목록", title: "글머리 목록" },
  { cmd: "insertOrderedList", label: "1. 목록", title: "번호 목록" },
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

  return (
    <div className={wrap}>
      <div className={bar}>
        {TOOLS.map((t, i) => (
          <button key={i} type="button" title={t.title} onMouseDown={(e) => { e.preventDefault(); armed.current = true; }} onClick={() => exec(t)} className={btn}>{t.label}</button>
        ))}
        <button type="button" title="링크" onMouseDown={(e) => e.preventDefault()} onClick={addLink} className={btn}>🔗</button>
        <button type="button" title="서식 지우기" onMouseDown={(e) => e.preventDefault()} onClick={clearFmt} className={btn}>✕서식</button>
        <span className={divider} />
        <button type="button" title="이미지 삽입" disabled={uploading}
          onMouseDown={(e) => { e.preventDefault(); saveSel(); }} onClick={() => imgFileRef.current?.click()} className={imgBtn}>
          {uploading ? "업로드 중…" : "🖼 이미지"}
        </button>
        <input ref={imgFileRef} type="file" accept="image/*" hidden onChange={(e) => { onPickImage(e.target.files); e.currentTarget.value = ""; }} />
      </div>

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
    </div>
  );
}
