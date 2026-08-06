import { PageHead } from "@/components/buzz/BuzzUI";
import NoticeSection from "@/components/buzz/sections/NoticeSection";

export default function BuzzNoticesPage() {
  return (
    <div>
      <PageHead title="공지사항" sub="본사에서 전달하는 공지 · 클릭 시 상세보기" />
      <NoticeSection />
    </div>
  );
}
