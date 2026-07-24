"use client";

import { Card, dv } from "@/components/division/DivisionUI";
import MyNoticeView from "@/components/MyNoticeView";

/** 본부 공지사항 — 본사에서 본부 대상으로 발행한 공지 (전체 or 내 본부). /api/my/notices */
export default function NoticesSection() {
  return (
    <Card title="공지사항" sub="본사에서 전달하는 본부 대상 공지 · 클릭 시 상세보기">
      <MyNoticeView c={{
        card: dv.card, box: dv.tableWrap, hover: dv.rowHover, badge: dv.badge,
        main: dv.cellMain, cellSub: dv.cellSub, note: dv.note, btn: dv.primaryBtn,
      }} />
    </Card>
  );
}
