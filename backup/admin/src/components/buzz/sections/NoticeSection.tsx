"use client";

import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import MyNoticeView from "@/components/MyNoticeView";

/** 버즈/매니저 공지사항 — 역할별 필터 리스트 + 상세 (/api/my/notices) */
export default function NoticeSection() {
  const { theme, isManager } = useBuzz();
  return (
    <Card title="공지사항" sub={isManager ? "관리매니저 대상 본사 공지" : "버즈회원 대상 본사 공지"}>
      <MyNoticeView asRole={isManager ? "MANAGER" : "BUZZ"} c={{
        card: theme.card, box: theme.tableWrap, hover: theme.rowHover, badge: theme.goldBadge,
        main: theme.cellMain, cellSub: theme.cellSub, note: theme.note, btn: theme.primaryBtn,
      }} />
    </Card>
  );
}
