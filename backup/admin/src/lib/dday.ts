// 계약(영업) 종료일 → D-day 계산 (상품마켓 D-O일 배지 / 영업마감 임박 안내)
// contractEndDate: "YYYY-MM-DD" (BE에서 LocalDate.toString()). 미등록이면 null.

export type DDay = {
  days: number;        // 오늘 기준 남은 일수 (당일=0, 지남=음수)
  label: string;       // 배지 문구: "D-5" / "D-0" / "마감"
  closingSoon: boolean; // 7일 미만 남음(0~6일) → 붉은 안내 노출
  expired: boolean;     // 종료일 지남
  message: string;      // 임박/마감 안내 문구
};

/** "YYYY-MM-DD" → D-day 정보. 미등록/파싱실패 시 null */
export function computeDday(contractEndDate?: string | null): DDay | null {
  if (!contractEndDate) return null;
  const end = new Date(`${contractEndDate}T00:00:00`);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((end.getTime() - today.getTime()) / 86400000);
  const expired = days < 0;
  const closingSoon = !expired && days < 7;
  const label = expired ? "마감" : `D-${days}`;
  const message = expired
    ? "영업이 마감되었습니다."
    : days === 0
      ? "오늘 영업이 마감됩니다."
      : `영업마감일 ${days}일 남았습니다.`;
  return { days, label, closingSoon, expired, message };
}

/** 1차영업 신청/등록 가능 여부: 종료일 미등록(상시) 또는 7일 이상 남음 (docs/07) */
export function canApplySale(contractEndDate?: string | null): boolean {
  const dd = computeDday(contractEndDate);
  return !dd || (!dd.expired && dd.days >= 7);
}
