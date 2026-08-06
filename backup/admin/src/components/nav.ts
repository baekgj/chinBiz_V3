// 본사 어드민(HQ Master) LNB 메뉴 (CLAUDE.md §8) — /master 하위 라우트
export type NavChild = { href: string; label: string };
export type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: string;
  children?: NavChild[];
};

export const DASHBOARD_HREF = "/master";

export const NAV: NavItem[] = [
  { href: "/master", label: "대시보드", desc: "종합 지표 현황", icon: "grid" },
  {
    href: "/master/partners", label: "파트너사 관리", desc: "입점 심사·계약·예치금/빌링", icon: "handshake",
    children: [
      { href: "/master/partners", label: "파트너관리" },
      { href: "/master/partners/inquiries", label: "상담신청" },
    ],
  },
  {
    href: "/master/products", label: "상품 관리", desc: "카테고리·상품·총수당 분배", icon: "box",
    children: [
      { href: "/master/products/categories", label: "카테고리 관리" },
      { href: "/master/products/new", label: "상품 등록" },
      { href: "/master/products", label: "상품 리스트" },
    ],
  },
  {
    href: "/master/organization", label: "조직망 및 영업 관리", desc: "본부·센터·매니저·버즈·영업", icon: "sitemap",
    children: [
      { href: "/master/organization/register", label: "본부·센터 등록" },
      { href: "/master/organization/members", label: "회원 리스트" },
      { href: "/master/organization", label: "조직망 관리" },
      { href: "/master/organization/sales", label: "영업 관리" },
    ],
  },
  {
    href: "/master/education", label: "교육 관리", desc: "매니저 상품 교육 신청·승인", icon: "book",
    children: [
      { href: "/master/education/apply", label: "교육이수 신청" },
      { href: "/master/education/approve", label: "교육이수 승인" },
    ],
  },
  {
    href: "/master/settlement", label: "수당 및 정산 관리", desc: "매출·마감·정산·지급", icon: "wallet",
    children: [
      { href: "/master/settlement/sales", label: "매출현황" },
      { href: "/master/settlement/closed", label: "마감내역" },
      { href: "/master/settlement/payments", label: "정산내역" },
      { href: "/master/settlement/paid", label: "지급내역" },
    ],
  },
  {
    href: "/master/notice", label: "공지사항", desc: "본부·센터·매니저·버즈 공지 발행", icon: "bell",
    children: [
      { href: "/master/notice/division", label: "본부 공지사항" },
      { href: "/master/notice/center", label: "센터 공지사항" },
      { href: "/master/notice/manager", label: "매니저 공지사항" },
      { href: "/master/notice/buzz", label: "버즈 공지사항" },
    ],
  },
  { href: "/master/complaints", label: "민원 관리 센터", desc: "VOC·정산 동결(Freeze)", icon: "headset" },
  {
    href: "/master/settings", label: "시스템 설정", desc: "RBAC·배정·약관·알람", icon: "gear",
    children: [
      { href: "/master/settings", label: "환경설정" },
      { href: "/master/settings/terms", label: "약관설정" },
      { href: "/master/settings/alarms", label: "알람설정" },
    ],
  },
];

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
