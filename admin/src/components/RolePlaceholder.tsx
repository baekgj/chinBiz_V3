import Link from "next/link";
import Icon from "./Icon";

/** 우선순위 3~6 역할별 워크스페이스 자리표시 (아직 미구축) */
export default function RolePlaceholder({
  role,
  title,
  theme,
  points,
  priority,
}: {
  role: string;
  title: string;
  theme: string;
  points: string[];
  priority: string;
}) {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-navy-900 p-8 text-center">
        <span className="grid mx-auto h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white">
          <Icon name="shield" className="h-7 w-7" />
        </span>
        <p className="mt-4 text-xs font-bold tracking-widest text-brand-400">{role}</p>
        <h1 className="mt-1 text-2xl font-black text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {priority} · 이 워크스페이스는 다음 단계에서 구축됩니다. 예정 테마: {theme}
        </p>
        <ul className="mx-auto mt-5 max-w-sm space-y-1.5 text-left text-sm text-slate-300">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> {p}
            </li>
          ))}
        </ul>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl border border-line px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-navy-800"
        >
          ← 역할 런처로
        </Link>
      </div>
    </div>
  );
}
