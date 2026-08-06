"use client";

import { useState } from "react";
import { PageHead, ct } from "@/components/center/CenterUI";
import EducationAdminPanel, { type EduCls } from "@/components/EducationAdminPanel";

const centerEduCls: EduCls = {
  card: ct.card, head: ct.cardHead, sub: ct.cardSub, tableWrap: ct.tableWrap, thead: ct.thead,
  rowHover: ct.rowHover, divide: ct.divide, cellMain: ct.cellMain, cellSub: ct.cellSub,
  primaryBtn: ct.primaryBtn, badge: ct.badge, note: ct.note,
};

export default function CenterEducationPage() {
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const tabBtn = (on: boolean) => `rounded-lg px-4 py-2 text-sm font-bold ${on ? ct.primaryBtn : `border ${ct.tableWrap} ${ct.cellSub}`}`;
  return (
    <div>
      <PageHead title="교육 관리" sub="매니저 상품 교육 이수 신청·승인" />
      <div className="mb-4 flex gap-2">
        <button className={tabBtn(tab === "pending")} onClick={() => setTab("pending")}>교육이수 신청</button>
        <button className={tabBtn(tab === "approved")} onClick={() => setTab("approved")}>교육이수 승인</button>
      </div>
      <EducationAdminPanel key={tab} mode={tab} cls={centerEduCls} />
    </div>
  );
}
