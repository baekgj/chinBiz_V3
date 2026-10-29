import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import NoticeList from "@/components/notice/NoticeList";

export const metadata = { title: "공지사항 · 친비즈(ChinBiz)", description: "친비즈 공지사항 — 신규 상품·정책·서비스 안내" };

/** 공지사항 리스트 (docs/32) — GNB/푸터 [공지사항] 진입 */
export default function NoticesPage() {
  return (
    <>
      <Header />
      <section className="relative overflow-hidden bg-forest-950 px-5 py-14 sm:py-16">
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-bold tracking-widest text-gold-300">NOTICE</p>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">공지사항</h1>
          <p className="mt-3 text-sm text-forest-100/80">친비즈의 새로운 상품과 정책, 서비스 소식을 안내해 드립니다.</p>
        </div>
      </section>
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
        <NoticeList />
      </main>
      <Footer />
    </>
  );
}
