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
  // 어두운 배경: 로고 글자가 검정이라 CIB 심볼 + 흰 워드마크로 표시
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="친비즈 홈으로"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/cib.png" alt="" className="h-6 w-auto" aria-hidden />
      </span>
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
