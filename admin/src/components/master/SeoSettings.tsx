"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { apiGet, apiPut } from "@/lib/api";

// 검색엔진최적화 메타태그 (docs/32) — app_setting seo_* → HOME <head> 에 적용(/api/public/seo)
const FIELDS: { key: string; label: string; placeholder: string; hint?: string; multiline?: boolean }[] = [
  { key: "seo_title", label: "사이트 제목 (title)", placeholder: "친비즈(ChinBiz) · 영업대행 ERP 플랫폼", hint: "검색 결과 제목 — 메인 등 별도 제목이 없는 화면의 기본 제목" },
  { key: "seo_description", label: "사이트 설명 (description)", placeholder: "검색 결과에 노출될 사이트 소개 문구 (80~160자 권장)", multiline: true },
  { key: "seo_keywords", label: "키워드 (keywords)", placeholder: "버즈마케팅, 영업대행, 영업 ERP, 친비즈", hint: "콤마(,)로 구분" },
  { key: "seo_author", label: "작성자 (author)", placeholder: "친쿠(주)" },
  { key: "seo_site_url", label: "대표 URL (canonical · sitemap)", placeholder: "https://chinbiz.kr", hint: "사이트맵/robots·대표 URL 기준 주소" },
  { key: "seo_og_image", label: "대표 이미지 URL (og:image)", placeholder: "https://chinbiz.kr/og.png", hint: "카카오톡·SNS 공유 썸네일 (1200×630 권장)" },
  { key: "seo_naver_verification", label: "네이버 사이트 인증 (naver-site-verification)", placeholder: "네이버 서치어드바이저 HTML 태그의 content 값" },
  { key: "seo_google_verification", label: "구글 사이트 인증 (google-site-verification)", placeholder: "구글 서치콘솔 HTML 태그의 content 값" },
];

export default function SeoSettings() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Record<string, string>>("/api/org/app-settings").then((r) => {
      if (r.ok && r.data) setVals(Object.fromEntries(FIELDS.map((f) => [f.key, r.data![f.key] ?? ""])));
    });
  }, []);

  async function save() {
    setSaving(true); setMsg(null);
    const r = await apiPut<{ message: string }>("/api/org/app-settings",
      Object.fromEntries(FIELDS.map((f) => [f.key, (vals[f.key] ?? "").trim()])));
    setSaving(false);
    setMsg(r.ok ? "저장되었습니다. HOME 에 수 분 내 반영됩니다." : (r.message || "저장 실패"));
  }

  const input = "w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500 placeholder:text-slate-600";

  return (
    <Card className="lg:col-span-2">
      <SectionTitle title="검색엔진 최적화 (메타태그)" sub="등록한 메타태그가 친비즈 HOME 의 <head> 에 적용됩니다 — 네이버·구글 검색 노출" />
      <div className="grid gap-4 rounded-xl bg-navy-800 p-4 md:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className={`block ${f.multiline ? "md:col-span-2" : ""}`}>
            <span className="mb-1.5 block text-xs font-semibold text-slate-300">{f.label}</span>
            {f.multiline ? (
              <textarea rows={3} maxLength={1000} value={vals[f.key] ?? ""} placeholder={f.placeholder}
                onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} className={input} />
            ) : (
              <input maxLength={1000} value={vals[f.key] ?? ""} placeholder={f.placeholder}
                onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} className={input} />
            )}
            {f.hint && <span className="mt-1 block text-[11px] text-slate-500">{f.hint}</span>}
          </label>
        ))}
        <div className="flex items-center justify-end gap-3 md:col-span-2">
          {msg && <span className="text-sm font-semibold text-brand-300">{msg}</span>}
          <button onClick={save} disabled={saving}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        * 상품별 검색 노출 정보(제목·설명·키워드·브랜드 등)는 [상품관리]-[상품등록/수정]의 <b className="text-slate-300">상품정보 · 검색노출(SEO)</b>에서 입력합니다.
        사이트맵 <span className="font-mono">/sitemap.xml</span> · <span className="font-mono">/robots.txt</span> 는 자동 생성됩니다.
      </p>
    </Card>
  );
}
