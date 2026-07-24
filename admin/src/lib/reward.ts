// 버즈/매니저 수당 금액 계산.
// RATE: 총수당 × 비율(%) / 100,  FIXED: 저장된 수당 금액(원) 그대로.
type RewardSrc = { rewardType?: string; totalAllowance?: number; buzzReward?: number; chinkuReward?: number; managerReward?: number };

export function rewardAmount(p: RewardSrc, key: "buzzReward" | "chinkuReward" | "managerReward"): number {
  const v = p[key] ?? 0;
  if (p.rewardType === "RATE") return Math.round((p.totalAllowance ?? 0) * v / 100);
  return v; // FIXED = 원 금액
}

/** 로그인 역할 기준 '내 수당' (매니저=관리매니저 수당, 버즈=버즈 수당) */
export function myReward(p: RewardSrc, isManager: boolean): number {
  return rewardAmount(p, isManager ? "managerReward" : "buzzReward");
}
