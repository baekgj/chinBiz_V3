// 상품 금액 라벨 — 월관리상품(monthlyCare)은 판매가가 아닌 월회비로 표시
export const priceLabel = (monthlyCare?: boolean | null) => (monthlyCare ? "월회비" : "판매가");
