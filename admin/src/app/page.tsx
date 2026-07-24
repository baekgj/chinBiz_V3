import Link from "next/link";
import Icon from "@/components/Icon";

const ROLES = [
  { href: "/master", role: "MASTER_ADMIN", title: "본사 어드민 (HQ Master)", note: "우선순위 2 · 구축 완료", ready: true },
  { href: "/partner", role: "PARTNER", title: "파트너 마스터 오피스", note: "우선순위 3", ready: false },
  { href: "/buzz", role: "BUZZ / MANAGER", title: "버즈 · 관리매니저", note: "우선순위 4", ready: false },
  { href: "/division", role: "DIVISION_ADMIN", title: "총괄본부 오피스", note: "우선순위 5", ready: false },
  { href: "/center", role: "CENTER_ADMIN", title: "센추럴 마스터 오피스", note: "우선순위 6", ready: false },
];

export default function AdminLauncher() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white">
          <Icon name="shield" className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-black text-white">친비즈 어드민 런처</h1>
          <p className="text-sm text-slate-500">로그인한 회원의 역할(role)에 따라 자동 이동됩니다. (직접 접근용 런처)</p>
        </div>
      </div>

      <ul className="mt-8 space-y-3">
        {ROLES.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="flex items-center justify-between rounded-xl border border-line bg-navy-900 px-5 py-4 transition-colors hover:border-brand-500/40 hover:bg-navy-800"
            >
              <span>
                <span className="block text-sm font-bold text-white">{r.title}</span>
                <span className="block text-xs text-slate-500">{r.role} · {r.href}</span>
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.ready ? "bg-pos/10 text-pos ring-1 ring-pos/30" : "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30"}`}>
                {r.note}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
