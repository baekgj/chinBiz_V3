import Link from "next/link";

export default function Logo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  // 밝은 배경(상단 헤더 등): CIB 공식 로고 이미지 그대로 사용
  if (variant === "dark") {
    return (
      <Link href="/" className={`inline-flex items-center ${className}`} aria-label="친비즈 홈으로">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/cib_logo.png" alt="친비즈 CHINBIZ" className="h-9 w-auto" />
      </Link>
    );
  }
  // 어두운 배경(하단 푸터·로그인 좌측 패널): 흰색 CIB 심볼(cib_white.png, docs/32) + 흰 워드마크
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="친비즈 홈으로"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/cib_white.png" alt="" className="h-8 w-auto" aria-hidden />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-black tracking-tight text-white">
          친비즈<span className="text-gold-500">.</span>
        </span>
        <span className="text-[10px] font-semibold tracking-[0.2em] text-forest-200">
          CHINBIZ
        </span>
      </span>
    </Link>
  );
}
