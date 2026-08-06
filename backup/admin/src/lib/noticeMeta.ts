// 공지사항 대상 메타 (URL 세그먼트 ↔ Notice.Target)
// scope: "division" = 본부 선택(target_id=본부 idx) / "center" = 본부→센터 cascade(target_id=센터 idx)
export type NoticeSeg = "division" | "center" | "manager" | "buzz";

export const NOTICE_META: Record<NoticeSeg, { key: string; label: string; scope: "division" | "center" }> = {
  division: { key: "DIVISION", label: "본부", scope: "division" },
  center: { key: "CENTER", label: "센터", scope: "center" },
  manager: { key: "MANAGER", label: "매니저", scope: "center" },
  buzz: { key: "BUZZ", label: "버즈", scope: "center" },
};

export const isNoticeSeg = (s: string): s is NoticeSeg =>
  s === "division" || s === "center" || s === "manager" || s === "buzz";
