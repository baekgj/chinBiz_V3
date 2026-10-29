import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import NoticeDetail from "@/components/notice/NoticeDetail";

export const metadata = { title: "공지사항 · 친비즈(ChinBiz)" };

/** 공지사항 상세 (docs/32) — 리스트 / 홈 공지 티커 클릭 진입 */
export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
        <NoticeDetail id={id} />
      </main>
      <Footer />
    </>
  );
}
