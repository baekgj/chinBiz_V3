// 입력값 자동 하이픈 포맷 (docs/24·24_1) — 숫자만 남기고 자리수에 따라 - 삽입

export const digitsOnly = (v: string) => (v ?? "").replace(/\D/g, "");

/** 사업자등록번호 000-00-00000 */
export function formatBiz(v: string): string {
  const d = digitsOnly(v).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

/** 전화/휴대폰 — 02(서울 2자리) / 그 외 3자리 지역·이동번호 */
export function formatPhone(v: string): string {
  const d = digitsOnly(v).slice(0, 11);
  if (d.startsWith("02")) {
    if (d.length < 3) return d;
    if (d.length < 6) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length < 10) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
  }
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length < 11) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 주민등록번호 000000-0000000 */
export function formatRRN(v: string): string {
  const d = digitsOnly(v).slice(0, 13);
  if (d.length < 7) return d;
  return `${d.slice(0, 6)}-${d.slice(6)}`;
}
