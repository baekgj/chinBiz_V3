import { PageHead } from "@/components/center/CenterUI";
import NoticeSection from "@/components/center/sections/NoticeSection";

export default function CenterNoticesPage() {
  return (
    <div>
      <PageHead title="공지사항" sub="본사에서 전달하는 공지 · 클릭 시 상세보기" />
      <NoticeSection />
    </div>
  );
}
