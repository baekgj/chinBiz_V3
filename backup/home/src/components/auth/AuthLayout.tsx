import Link from "next/link";
import Logo from "@/components/Logo";

const POINTS = [
  "성과 기반 100% 투명 정산 시스템",
  "클릭 몇 번으로 끝나는 1차 영업 툴킷",
  "추천 네트워크로 만드는 평생 수익",
];

export default function AuthLayout({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-forest-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="grid-pattern absolute inset-0 opacity-50" />
        <div className="animate-blob absolute -left-16 top-24 h-72 w-72 rounded-full bg-forest-500/30 blur-3xl" />
        <div className="animate-blob absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />

        <div className="relative">
          <Logo variant="light" />
        </div>

        <div className="relative">
          <p className="text-xs font-bold tracking-[0.2em] text-gold-300">
            KOREA&apos;S FIRST BUZZ MARKETING SOLUTION
          </p>
          <h2 className="mt-4 text-3xl font-black leading-snug">
            내 네트워크가 곧
            <br />
            <span className="text-gold-gradient">비즈니스</span>가 된다
          </h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-forest-100/90">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-400 text-forest-900">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-forest-200/60">
          © 2026 ChinBiz. All Rights Reserved.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <p className="text-xs font-bold tracking-widest text-gold-500">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-8 text-center text-xs text-muted">
            <Link href="/" className="font-medium hover:text-forest-600">
              ← 친비즈 홈으로 돌아가기
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
