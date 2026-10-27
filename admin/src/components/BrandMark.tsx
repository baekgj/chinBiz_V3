// 각 admin 상단 로고 아이콘 — CIB 심볼(흰 타일 위, 다크/라이트 테마 공용)
export default function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/cib.png" alt="" aria-hidden className="h-6 w-auto" />
    </span>
  );
}
