// 본사 어드민(HQ Master) LNB 메뉴 (CLAUDE.md §8) — /master 하위 라우트
export type NavChild = { href: string; label: string };
// RBAC 담당영역(docs/20 Task4): A=파트너·상품·교육, B=조직망/영업, C=수당/정산, D=공지·민원.
// SUPER=슈퍼(미지정)만 접근. area 미지정 항목(대시보드)은 모두 접근.
export type NavArea = "A" | "B" | "C" | "D" | "SUPER";
export type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: string;
  area?: NavArea;
  children?: NavChild[];
};

export const DASHBOARD_HREF = "/master";

// 담당영역 정의(환경설정 RBAC 카드 · 필터에서 공용)
export const RBAC_AREAS: { code: NavArea; label: string; menus: string }[] = [
  { code: "A", label: "담당자 A", menus: "파트너사 관리 · 상품 관리 · 교육 관리" },
  { code: "B", label: "담당자 B", menus: "조직망 및 영업 관리" },
  { code: "C", label: "담당자 C", menus: "수당 및 정산 관리" },
  { code: "D", label: "담당자 D", menus: "공지사항 · 민원 관리 센터" },
];

export const NAV: NavItem[] = [
  { href: "/master", label: "대시보드", desc: "종합 지표 현황", icon: "grid" },
  {
    href: "/master/partners", label: "파트너사 관리", desc: "입점 심사·계약·예치금/빌링", icon: "handshake", area: "A",
    children: [
      { href: "/master/partners", label: "파트너관리" },
      { href: "/master/partners/inquiries", label: "상담신청" },
    ],
  },
  {
    href: "/master/products", label: "상품 관리", desc: "카테고리·상품·총수당 분배", icon: "box", area: "A",
    children: [
      { href: "/master/products/categories", label: "카테고리 관리" },
      { href: "/master/products/new", label: "상품 등록" },
      { href: "/master/products", label: "상품 리스트" },
    ],
  },
  {
    href: "/master/organization", label: "조직망 및 영업 관리", desc: "본부·센터·매니저·버즈·영업", icon: "sitemap", area: "B",
    children: [
      { href: "/master/organization/register", label: "본부·센터 등록" },
      { href: "/master/organization/members", label: "회원 리스트" },
      { href: "/master/organization/manager-applications", label: "매니저신청" },
      { href: "/master/organization", label: "조직망 관리" },
      { href: "/master/organization/sales", label: "영업 관리" },
    ],
  },
  {
    href: "/master/education", label: "교육 관리", desc: "매니저 상품 교육 신청·승인", icon: "book", area: "A",
    children: [
      { href: "/master/education/apply", label: "교육이수 신청" },
      { href: "/master/education/approve", label: "교육이수 승인" },
    ],
  },
  {
    href: "/master/settlement", label: "수당 및 정산 관리", desc: "매출·마감·정산·지급", icon: "wallet", area: "C",
    children: [
      { href: "/master/settlement/sales", label: "매출현황" },
      { href: "/master/settlement/closed", label: "마감내역" },
      { href: "/master/settlement/payments", label: "정산내역" },
      { href: "/master/settlement/paid", label: "지급내역" },
    ],
  },
  {
    href: "/master/notice", label: "공지사항", desc: "본부·센터·매니저·버즈 공지 발행", icon: "bell", area: "D",
    children: [
      { href: "/master/notice/division", label: "본부 공지사항" },
      { href: "/master/notice/center", label: "센터 공지사항" },
      { href: "/master/notice/manager", label: "매니저 공지사항" },
      { href: "/master/notice/buzz", label: "버즈 공지사항" },
    ],
  },
  { href: "/master/complaints", label: "민원 관리 센터", desc: "VOC·정산 동결(Freeze)", icon: "headset", area: "D" },
  {
    href: "/master/settings", label: "시스템 설정", desc: "RBAC·배정·약관·알람", icon: "gear", area: "SUPER",
    children: [
      { href: "/master/settings", label: "환경설정" },
      { href: "/master/settings/terms", label: "약관설정" },
      { href: "/master/settings/alarms", label: "알람설정" },
    ],
  },
];

/** 담당영역 없음(=슈퍼) 여부 */
export function isSuperScope(scopes?: string[] | null): boolean {
  return !scopes || scopes.length === 0;
}

/** 담당영역(scopes)에 따라 접근 가능한 LNB 항목만 반환. 슈퍼는 전체. */
export function visibleNav(scopes?: string[] | null): NavItem[] {
  if (isSuperScope(scopes)) return NAV;
  const s = scopes as string[];
  return NAV.filter((n) => !n.area || (n.area !== "SUPER" && s.includes(n.area)));
}

/** 특정 경로가 담당영역으로 접근 가능한지 */
export function pathAllowed(pathname: string, scopes?: string[] | null): boolean {
  if (isSuperScope(scopes)) return true;
  const s = scopes as string[];
  // pathname 에 가장 길게 매칭되는 상위 메뉴 결정
  const item = NAV
    .filter((n) => n.href === pathname || (n.href !== DASHBOARD_HREF && pathname.startsWith(n.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (!item) return pathname === DASHBOARD_HREF; // 매칭 없으면 대시보드만 허용
  if (!item.area) return true;              // 대시보드 등
  return item.area !== "SUPER" && s.includes(item.area);
}

// titleForPath 용 평면 목록 (부모 + 자식)
const FLAT: { href: string; label: string; desc: string }[] = NAV.flatMap((n) => [
  { href: n.href, label: n.label, desc: n.desc },
  ...(n.children ?? []).map((c) => ({ href: c.href, label: c.label, desc: n.desc })),
]);

export function titleForPath(pathname: string): { label: string; desc: string } {
  const exact = FLAT.find((n) => n.href === pathname);
  if (exact) return exact;
  const pref = FLAT
    .filter((n) => n.href !== DASHBOARD_HREF && pathname.startsWith(n.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return pref ?? FLAT[0];
}
