import Logo from "@/components/Logo";

const COLS = [
  {
    title: "서비스",
    links: [
      { label: "친비즈 소개", href: "/about" },
      { label: "상품 둘러보기", href: "/products" },
      { label: "업무 프로세스", href: "/process" },
      { label: "공지사항", href: "/#partner" },
    ],
  },
  {
    title: "회원",
    links: [
      { label: "버즈회원 가입", href: "/signup" },
      { label: "로그인", href: "/login" },
      { label: "파트너사 입점문의", href: "/partner-apply" },
    ],
  },
  {
    title: "법적 고지",
    links: [
      { label: "이용약관", href: "#" },
      { label: "개인정보처리방침", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-forest-900 text-forest-100">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-forest-200/80">
              영업 파트너와 기업을 연결하고, 실시간 성과 관리부터 투명한 수당 정산까지 자동화하는
              대한민국 최초의 버즈마케팅 영업대행 ERP 플랫폼입니다.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-forest-200/75 transition-colors hover:text-gold-300"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-xs leading-relaxed text-forest-200/70">
          <p className="font-semibold text-forest-100">훈마(주) · 친비즈(ChinBiz)</p>
          <p className="mt-1.5">
            대표 최경호 &nbsp;|&nbsp; 사업자등록번호 822-81-00277 &nbsp;|&nbsp; 통신판매업신고번호
            제0000-서울강남-0000호
          </p>
          <p className="mt-1">
            서울특별시 강남구 테헤란로 &nbsp;|&nbsp; 고객센터 02-6412-0505 &nbsp;|&nbsp;
            help@chinbiz.com
          </p>
          <p className="mt-4">Copyright © 2026 ChinBiz. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
