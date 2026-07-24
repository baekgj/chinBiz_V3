import { PageHead } from "@/components/division/DivisionUI";
import LeaderboardSection from "@/components/division/sections/LeaderboardSection";

export default function DivisionLeaderboardPage() {
  return (
    <div>
      <PageHead title="센터 리더보드" sub="센터 순위 및 소속·관리 기여도 분석" />
      <LeaderboardSection />
    </div>
  );
}
