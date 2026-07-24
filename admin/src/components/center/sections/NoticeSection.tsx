"use client";

import { Card, ct } from "@/components/center/CenterUI";
import MyNoticeView from "@/components/MyNoticeView";

/** 센터 공지사항 — 본사에서 센터 대상으로 발행한 공지 (전체 or 내 센터). /api/my/notices */
export default function NoticeSection() {
  return (
    <Card title="공지사항" sub="본사에서 전달하는 센터 대상 공지 · 클릭 시 상세보기">
      <MyNoticeView c={{
        card: ct.card, box: ct.tableWrap, hover: ct.rowHover, badge: ct.badge,
        main: ct.cellMain, cellSub: ct.cellSub, note: ct.note, btn: ct.primaryBtn,
      }} />
    </Card>
  );
}
