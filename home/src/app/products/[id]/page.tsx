"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { API_BASE, mediaUrl, resolveAdminUrl } from "@/lib/api";

type Detail = {
  id: number; name: string; partnerId?: number | null; partnerName?: string | null; categoryId?: number | null; categoryName?: string | null;
  images: string[]; videoUrl?: string | null; monthlyCare?: boolean; asSupport?: boolean;
  popular?: boolean; recommended?: boolean; role?: string | null; description?: string | null;
  specEffect?: string | null; salesTarget?: string | null; productFeature?: string | null; processFlow?: string | null;
  buzzRewardWon?: number; managerRewardWon?: number;
  partnerProducts?: { id: number; name: string; image1?: string | null; salePrice?: number | null }[];
};

type ManagedSale = { id: number; createdAt?: string | null; customerName?: string | null; buzzName?: string | null; centerName?: string | null; status?: string | null };

const won = (n?: number) => "₩" + (n ?? 0).toLocaleString("ko-KR");

function readToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )chinbiz_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** YouTube/Vimeo URL → 자동재생 임베드 URL (아니면 null) */
function embedUrl(url?: string | null): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1`;
  return null;
}

function ImageMonitor() {
  return (
    <div className="grid h-full w-full place-items-center text-forest-300">
      <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none"><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 20h8M12 18v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    </div>
  );
}

/** HTML에 실제 콘텐츠(텍스트/이미지/영상 등)가 있는지 */
function hasContent(html?: string | null): boolean {
  if (!html) return false;
  if (/<(img|iframe|video|source|embed|svg|picture)\b/i.test(html)) return true; // 이미지·영상만 등록한 경우
  return !!html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
}

/** 본문 HTML 내 이미지 src(/uploads·레거시 절대URL)를 현재 API_BASE 로 재구성(dev/prod 공통 로딩) */
function rehostHtml(html?: string | null): string {
  if (!html) return "";
  return html.replace(/(\ssrc=)(["'])(.*?)\2/gi, (_m, pre, q, url) => `${pre}${q}${mediaUrl(url)}${q}`);
}

/** 등록된 내용이 있을 때만 노출되는 HTML 섹션 */
function RichBlock({ title, html }: { title: string; html?: string | null }) {
  if (!hasContent(html)) return null;
  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="text-lg font-black text-ink">{title}</h2>
      <div className="rte-content mt-3 text-sm leading-relaxed text-ink-soft" dangerouslySetInnerHTML={{ __html: rehostHtml(html) }} />
    </section>
  );
}

type OtherProduct = { id: number; name: string; image1?: string | null; salePrice?: number | null };

/** 파트너사 다른 상품 — 데스크톱 4개·모바일 2개씩 페이징 + 좌우 화살표 + 슬라이드 효과 */
function PartnerProductsCarousel({ partnerName, products }: { partnerName: string; products: OtherProduct[] }) {
  const [perPage, setPerPage] = useState(4); // 모바일 2 / sm↑ 4
  const [page, setPage] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => setPerPage(mq.matches ? 4 : 2);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const pages = Math.max(1, Math.ceil(products.length / perPage));
  useEffect(() => { setPage((p) => Math.min(p, pages - 1)); }, [pages]); // 브레이크포인트 변경 시 페이지 보정

  const canPrev = page > 0;
  const canNext = page < pages - 1;
  const arrowCls = "grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-lg font-bold text-ink-soft transition hover:border-forest-300 hover:text-forest-700 disabled:cursor-default disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink-soft";

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-ink">{partnerName}의 다른 상품</h2>
        {pages > 1 && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!canPrev} aria-label="이전 상품" className={arrowCls}>‹</button>
            <button type="button" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={!canNext} aria-label="다음 상품" className={arrowCls}>›</button>
          </div>
        )}
      </div>

      <div className="mt-4 overflow-hidden">
        <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${page * 100}%)` }}>
          {products.map((o) => (
            <div key={o.id} className="box-border w-1/2 shrink-0 px-2 sm:w-1/4">
              <Link href={`/products/${o.id}`} className="group block overflow-hidden rounded-xl border border-line bg-white transition-all hover:border-forest-300 hover:shadow-md">
                <div className="aspect-square w-full bg-forest-50">
                  {o.image1 ? <img src={mediaUrl(o.image1)} alt={o.name} className="h-full w-full object-cover" /> : <ImageMonitor />}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-bold text-ink">{o.name}</p>
                  <p className="mt-0.5 text-sm font-black text-forest-700">{won(o.salePrice ?? 0)}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {pages > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: pages }).map((_, i) => (
            <button key={i} type="button" onClick={() => setPage(i)} aria-label={`${i + 1}페이지`}
              className={`h-1.5 rounded-full transition-all ${i === page ? "w-5 bg-forest-600" : "w-1.5 bg-line hover:bg-forest-300"}`} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [d, setD] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [mainImg, setMainImg] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    const token = readToken();
    fetch(`${API_BASE}/api/public/products/${params.id}`, {
      headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Detail) => { setD(data); setStatus("ok"); })
      .catch(() => setStatus("error"));
  }, [params?.id]);

  const embed = useMemo(() => embedUrl(d?.videoUrl), [d?.videoUrl]);
  const role = d?.role ?? null;
  // 버즈 admin [1차 영업 등록] 화면 (크로스 앱). 상품·카테고리 자동선택 + 매니저여도 B(버즈)모드로 진입.
  const applyHref = useMemo(() => {
    if (!d) return "#";
    const q = new URLSearchParams({ productId: String(d.id), view: "buzz" });
    if (d.categoryId != null) q.set("categoryId", String(d.categoryId));
    return `${resolveAdminUrl()}/buzz/pipeline/new?${q.toString()}`;
  }, [d]);

  // [설치완료 사진찍기] → 해당 상품의 내 2차영업관리 신청 리스트 레이어팝업
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoRows, setPhotoRows] = useState<ManagedSale[] | null>(null);

  async function openInstallList() {
    if (!d) return;
    setPhotoOpen(true);
    setPhotoRows(null);
    const token = readToken();
    try {
      const r = await fetch(`${API_BASE}/api/buzz/sales/managed?productId=${d.id}&size=100`, {
        headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" },
      });
      const j = r.ok ? await r.json() : null;
      setPhotoRows((j?.content as ManagedSale[]) ?? []);
    } catch { setPhotoRows([]); }
  }

  // 고객 클릭 → 매니저 admin 2차영업관리 진행관리(영업권확보) 레이어로 이동 (M모드)
  function goManage(saleId: number) {
    window.location.href = `${resolveAdminUrl()}/buzz/managed?assign=${saleId}&view=manager`;
  }

  async function copyUrl() {
    try {
      const url = window.location.href;
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(url);
      else if (navigator.share) { await navigator.share({ url }); return; }
      else { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
      setToast("상품 URL이 복사되었습니다. 카카오톡·SNS에 공유하세요!");
    } catch { setToast("복사에 실패했습니다."); }
    setTimeout(() => setToast(null), 2600);
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
          <Link href="/products" className="text-sm font-semibold text-ink-soft hover:text-forest-700">← 상품 둘러보기</Link>

          {status === "loading" && <p className="mt-10 text-center text-sm text-muted">불러오는 중…</p>}
          {status === "error" && <p className="mt-10 text-center text-sm text-danger">상품을 찾을 수 없습니다.</p>}

          {status === "ok" && d && (
            <div className="mt-4 space-y-8">
              {/* 상단: 이미지 + 정보 */}
              <div className="grid gap-8 lg:grid-cols-2">
                {/* 상품 이미지 (메인 + 소이미지 hover) */}
                <div>
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-forest-50">
                    {d.images.length > 0 ? <img src={mediaUrl(d.images[mainImg])} alt={d.name} className="h-full w-full object-cover" /> : <ImageMonitor />}
                  </div>
                  {d.images.length > 1 && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {d.images.slice(0, 5).map((img, i) => (
                        <button key={i} onMouseEnter={() => setMainImg(i)} onClick={() => setMainImg(i)}
                          className={`aspect-square overflow-hidden rounded-lg border-2 ${i === mainImg ? "border-forest-600" : "border-line"}`}>
                          <img src={mediaUrl(img)} alt={`${d.name} ${i + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex flex-col">
                  <div className="flex flex-wrap gap-2">
                    {d.monthlyCare && <span className="rounded-md bg-forest-600 px-2.5 py-1 text-xs font-black text-white">월관리상품</span>}
                    {d.asSupport && <span className="rounded-md bg-forest-100 px-2.5 py-1 text-xs font-black text-forest-800">AS지원</span>}
                    {d.popular && <span className="rounded-md bg-gold-400 px-2.5 py-1 text-xs font-black text-forest-900">인기</span>}
                    {d.recommended && <span className="rounded-md bg-forest-600 px-2.5 py-1 text-xs font-black text-white">추천</span>}
                  </div>
                  <p className="mt-3 text-sm font-medium text-muted">{d.partnerName ?? "파트너사"}{d.categoryName ? ` · ${d.categoryName}` : ""}</p>
                  <h1 className="mt-1 text-2xl font-black leading-tight text-ink sm:text-3xl">{d.name}</h1>

                  {/* 수익 요약 (버즈=CP / 매니저=MP) */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-forest-200 bg-forest-50 p-4">
                      <p className="text-xs font-bold text-forest-700">버즈회원 추천 수당 (CP)</p>
                      <p className="mt-1 text-xl font-black text-forest-800">{won(d.buzzRewardWon)}</p>
                    </div>
                    <div className="rounded-2xl border border-gold-400/40 bg-gold-50 p-4">
                      <p className="text-xs font-bold text-forest-700">관리매니저 이행 수당 (MP)</p>
                      <p className="mt-1 text-xl font-black text-forest-800">{won(d.managerRewardWon)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    * 실제 지급액은 영업 단계·정산 정책에 따라 확정됩니다. 아래 <b className="text-forest-700">수익을 만드는 2가지 방법</b>에서 자세히 확인하세요.
                  </p>
                </div>
              </div>

              {/* 동영상 (등록 시 자동재생) */}
              {embed && (
                <section className="overflow-hidden rounded-2xl border border-line bg-black">
                  <div className="aspect-video w-full">
                    <iframe src={embed} title="상품 영상" className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                  </div>
                </section>
              )}

              {/* 파트너사 다른 상품 — 4개씩 페이징 캐러셀 (동영상과 상세설명 사이) */}
              {d.partnerProducts && d.partnerProducts.length > 0 && (
                <PartnerProductsCarousel partnerName={d.partnerName ?? "파트너사"} products={d.partnerProducts} />
              )}

              {/* 상품 상세 설명 (역할별) */}
              {hasContent(d.description) && (
                <section className="rounded-2xl border border-line bg-white p-6">
                  <h2 className="text-lg font-black text-ink">상품 상세 설명</h2>
                  <div className="rte-content mt-3 text-sm leading-relaxed text-ink-soft" dangerouslySetInnerHTML={{ __html: rehostHtml(d.description) }} />
                </section>
              )}

              {/* 확장 상세 4종 */}
              <RichBlock title="핵심 스펙 / 효과" html={d.specEffect} />
              <RichBlock title="영업 대상" html={d.salesTarget} />
              <RichBlock title="상품 특징" html={d.productFeature} />
              <RichBlock title="처리 프로세스" html={d.processFlow} />

              {/* ★ 이 상품으로 수익을 만드는 2가지 방법 (goods_view.docx 04/REVENUE) */}
              <section>
                <p className="text-xs font-bold tracking-widest text-muted">04 / REVENUE</p>
                <h2 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
                  이 상품으로 수익을 만드는 <span className="text-forest-700">2가지 방법</span>
                </h2>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {/* OPTION A · CP — 버즈회원 */}
                  <div className="relative overflow-hidden rounded-2xl bg-[#f4511e] p-6 text-white shadow-sm sm:p-7">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold tracking-widest text-white/70">OPTION A · CP</span>
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-black/80 text-sm">↗</span>
                    </div>
                    <p className="mt-6 text-lg font-black">■ 버즈회원</p>
                    <p className="mt-2 text-xl font-black leading-snug sm:text-2xl">주변 사장님께 추천만 하세요!</p>
                    <div className="mt-6 flex items-end gap-2 border-t border-white/25 pt-5">
                      <span className="pb-1 text-xs text-white/80">추천 성공 시</span>
                      <span className="text-sm font-bold text-white/90">건당 최대</span>
                      <span className="text-2xl font-black sm:text-3xl">{won(d.buzzRewardWon)}</span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-white/85">
                      실사·계약·시공은 친비즈 매니저가 모두 전담합니다. 추천만 하면 수수료(CP)가 적립됩니다.
                    </p>
                  </div>
                  {/* OPTION B · MP — 관리매니저 */}
                  <div className="relative overflow-hidden rounded-2xl bg-[#0b46c3] p-6 text-white shadow-sm sm:p-7">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold tracking-widest text-white/70">OPTION B · MP</span>
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-sm">↗</span>
                    </div>
                    <p className="mt-6 text-lg font-black">■ 관리매니저</p>
                    <p className="mt-2 text-xl font-black leading-snug sm:text-2xl">현장 방문 및 실사·계약을 전담하세요!</p>
                    <div className="mt-6 flex items-end gap-2 border-t border-white/25 pt-5">
                      <span className="pb-1 text-xs text-white/80">이행 완료 시</span>
                      <span className="text-sm font-bold text-white/90">건당</span>
                      <span className="text-2xl font-black sm:text-3xl">{won(d.managerRewardWon)}</span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-white/85">
                      관할 구역 리드 인계 + 이행 완료 시 수수료(MP) 적립. 전문 매니저로 활동하세요.
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted">* CP · MP 포인트는 친비즈 정책에 따라 적립됩니다.</p>
              </section>

              {/* 하단 CTA — 역할별 (본문 내 영역, 고정 아님) */}
              <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  {!role && (
                    <>
                      <Link href="/signup" className="w-full flex-1 rounded-xl bg-gold-400 px-5 py-3 text-center text-sm font-bold text-forest-900 hover:bg-gold-300">버즈회원 가입하고 추천 수수료 받기</Link>
                      <Link href="/login" className="w-full flex-1 rounded-xl border border-forest-600/40 px-5 py-3 text-center text-sm font-bold text-forest-700 hover:bg-forest-50">현장 이행 전문 매니저 신청하기</Link>
                    </>
                  )}
                  {role === "BUZZ" && (
                    <>
                      <a href={applyHref} className="w-full flex-1 rounded-xl bg-forest-800 px-5 py-3 text-center text-sm font-bold text-white hover:bg-forest-700">가망고객 접수하기</a>
                      <button onClick={copyUrl} className="w-full flex-1 rounded-xl border border-forest-600/40 px-5 py-3 text-center text-sm font-bold text-forest-700 hover:bg-forest-50">🔗 상품화면 URL 복사하기</button>
                    </>
                  )}
                  {role === "MANAGER" && (
                    <>
                      <a href={applyHref} className="w-full flex-1 rounded-xl bg-forest-800 px-5 py-3 text-center text-sm font-bold text-white hover:bg-forest-700">가망고객 접수하기</a>
                      <button onClick={openInstallList} className="w-full flex-1 rounded-xl bg-gold-400 px-5 py-3 text-center text-sm font-bold text-forest-900 hover:bg-gold-300">📷 설치완료 사진등록</button>
                    </>
                  )}
                  {role && role !== "BUZZ" && role !== "MANAGER" && (
                    <button onClick={copyUrl} className="w-full flex-1 rounded-xl border border-forest-600/40 px-5 py-3 text-center text-sm font-bold text-forest-700 hover:bg-forest-50">🔗 상품화면 URL 복사하기</button>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {toast && (
        <div className="fixed inset-x-0 bottom-8 z-50 mx-auto w-fit max-w-[90%] rounded-xl bg-forest-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl">{toast}</div>
      )}

      {/* [설치완료 사진찍기] 레이어팝업 — 내 2차영업관리 신청 리스트 (해당 상품) */}
      {photoOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onClick={() => setPhotoOpen(false)}>
          <div className="flex h-[80vh] w-[80vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[70vh] sm:w-[70vw]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-ink">설치완료 사진등록 · 2차영업관리</h3>
                <p className="text-xs text-muted">{d?.name} · 고객을 선택하면 진행관리(영업권 확보) 화면으로 이동합니다.</p>
              </div>
              <button onClick={() => setPhotoOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-surface">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="sticky top-0 bg-surface">
                  <tr className="text-xs text-muted">
                    <th className="px-4 py-2.5 text-left font-semibold">등록일자</th>
                    <th className="px-4 py-2.5 text-left font-semibold">고객명</th>
                    <th className="px-4 py-2.5 text-left font-semibold">1차영업자</th>
                    <th className="px-4 py-2.5 text-left font-semibold">활동센터</th>
                    <th className="px-4 py-2.5 text-center font-semibold">영업단계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {photoRows === null ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">불러오는 중…</td></tr>
                  ) : photoRows.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">해당 상품으로 배정받은 2차 영업 건이 없습니다.</td></tr>
                  ) : photoRows.map((s) => (
                    <tr key={s.id} onClick={() => goManage(s.id)} className="cursor-pointer hover:bg-surface">
                      <td className="px-4 py-3 text-ink-soft">{s.createdAt ?? "-"}</td>
                      <td className="px-4 py-3 font-bold text-ink">{s.customerName ?? "-"}</td>
                      <td className="px-4 py-3 text-ink-soft">{s.buzzName ?? "-"}</td>
                      <td className="px-4 py-3 text-ink-soft">{s.centerName ?? "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-forest-100 px-2 py-0.5 text-xs font-bold text-forest-700">{s.status ?? "-"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
