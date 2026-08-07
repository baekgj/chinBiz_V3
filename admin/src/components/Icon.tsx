// 인라인 SVG 아이콘 세트 (외부 의존성 없음)
export default function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    grid: (<><rect x="3" y="3" width="7" height="7" rx="1.5" {...p} /><rect x="14" y="3" width="7" height="7" rx="1.5" {...p} /><rect x="3" y="14" width="7" height="7" rx="1.5" {...p} /><rect x="14" y="14" width="7" height="7" rx="1.5" {...p} /></>),
    handshake: (<path d="M12 6.5 9.5 4.5a2 2 0 0 0-2.6.1L3 8m9 -1.5 2.5-2a2 2 0 0 1 2.6.1L21 8m-9-1.5v2m-5 3 2.5 2.5a1.5 1.5 0 0 0 2.2 0l.3-.3.4.4a1.5 1.5 0 0 0 2.2 0 1.5 1.5 0 0 0 0-2.2l.4.4a1.5 1.5 0 0 0 2.2-2.2L14 6.5M3 8v5l3 3m15-8v5l-3 3" {...p} />),
    box: (<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v18M4 7l8 4 8-4" {...p} />),
    sitemap: (<><rect x="9" y="3" width="6" height="4" rx="1" {...p} /><rect x="3" y="17" width="6" height="4" rx="1" {...p} /><rect x="15" y="17" width="6" height="4" rx="1" {...p} /><path d="M12 7v4M6 17v-3h12v3" {...p} /></>),
    wallet: (<path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 0-2 2m0 0v7a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3m0-5v5m0-5h-4a2.5 2.5 0 0 0 0 5h4" {...p} />),
    headset: (<path d="M4 13v-1a8 8 0 0 1 16 0v1m0 0v3a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h3M4 13a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1 2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1h1Zm12 6v.5a2.5 2.5 0 0 1-2.5 2.5H12" {...p} />),
    gear: (<><circle cx="12" cy="12" r="3" {...p} /><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2" {...p} /></>),
    book: (<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 0v14m15-3H6" {...p} />),
    bell: (<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6m3 9a3 3 0 0 0 6 0" {...p} />),
    logout: (<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h10" {...p} />),
    shield: (<path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" {...p} />),
    trend: (<path d="M4 17l6-6 4 4 6-8M14 7h6v6" {...p} />),
    check: (<path d="M5 12.5 10 17.5 19 6.5" {...p} />),
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {paths[name] ?? paths.grid}
    </svg>
  );
}
