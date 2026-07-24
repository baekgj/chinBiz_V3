// 상품설명 등 사용자 입력 HTML을 렌더 전 정화(XSS 방지). 의존성 없는 허용목록 방식.
const ALLOWED = new Set([
  "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "P", "BR", "DIV", "SPAN",
  "H1", "H2", "H3", "H4", "UL", "OL", "LI", "A", "IMG", "BLOCKQUOTE", "PRE", "CODE",
]);
// 태그+내용까지 통째로 제거(스크립트 등 위험 요소)
const DROP = new Set([
  "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META", "FORM",
  "INPUT", "BUTTON", "TEXTAREA", "SELECT", "SVG", "VIDEO", "AUDIO", "SOURCE", "BASE",
]);

function safeUrl(v: string | null): boolean {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("mailto:") || t.startsWith("/") || t.startsWith("data:image/");
}

// style 은 width/height/max-width 만 허용 (이미지 크기 조절값 보존), url()·expression 차단
function cleanStyle(v: string): string {
  return v.split(";").map((s) => s.trim()).filter(Boolean)
    .filter((d) => /^(max-width|width|height)\s*:/i.test(d) && !/(url\(|expression|javascript:|@import)/i.test(d))
    .join("; ");
}

function sanitizeNode(node: Node) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) return;         // 텍스트 허용
    if (child.nodeType !== Node.ELEMENT_NODE) { child.parentNode?.removeChild(child); return; } // 주석 등 제거
    const el = child as HTMLElement;
    const tag = el.tagName.toUpperCase();
    if (DROP.has(tag)) { el.remove(); return; }
    sanitizeNode(el);                                       // 자식 먼저 정화
    // 속성 정화
    Array.from(el.attributes).forEach((a) => {
      const n = a.name.toLowerCase();
      if (n.startsWith("on")) { el.removeAttribute(a.name); return; }        // 이벤트 핸들러 제거
      if (n === "alt" || n === "title") return;
      if (n === "href" && tag === "A") { if (!safeUrl(a.value)) el.removeAttribute(a.name); return; }
      if (n === "src" && tag === "IMG") { if (!safeUrl(a.value)) el.removeAttribute(a.name); return; }
      if (n === "style") { const s = cleanStyle(a.value); if (s) el.setAttribute("style", s); else el.removeAttribute("style"); return; }
      el.removeAttribute(a.name);                                            // 그 외 속성 제거
    });
    if (tag === "A") { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener noreferrer"); }
    if (!ALLOWED.has(tag)) {                                // 허용목록 외 태그는 언랩(내용만 유지)
      const parent = el.parentNode;
      if (parent) { while (el.firstChild) parent.insertBefore(el.firstChild, el); el.remove(); }
    }
  });
}

/** HTML 문자열을 정화해 반환 (브라우저 전용) */
export function sanitizeHtml(html?: string | null): string {
  if (!html || typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}
