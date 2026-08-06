import Link from "next/link";

export default function Logo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const wordColor = variant === "light" ? "text-white" : "text-ink";
  const subColor = variant === "light" ? "text-forest-200" : "text-muted";
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="친비즈 홈으로"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 shadow-sm ring-1 ring-gold-400/40">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M5.5 14.5c2.6 2.8 6.4 3 9 .8"
            stroke="#e0b34d"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <circle cx="9" cy="8" r="2.3" stroke="white" strokeWidth="2" />
          <circle cx="16" cy="10.5" r="2.3" stroke="white" strokeWidth="2" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-lg font-black tracking-tight ${wordColor}`}>
          친비즈<span className="text-gold-500">.</span>
        </span>
        <span className={`text-[10px] font-semibold tracking-[0.2em] ${subColor}`}>
          CHINBIZ
        </span>
      </span>
    </Link>
  );
}
