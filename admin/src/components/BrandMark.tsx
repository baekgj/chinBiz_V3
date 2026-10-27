// 각 admin 상단 로고 아이콘 — 배경 타일 없이 CIB 심볼만. 밝은 헤더는 컬러(cib.png), 어두운 헤더는 흰색(cib_white.png)
export default function BrandMark({ light = false }: { light?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={light ? "/brand/cib.png" : "/brand/cib_white.png"} alt="" aria-hidden className="h-7 w-auto shrink-0" />
  );
}
