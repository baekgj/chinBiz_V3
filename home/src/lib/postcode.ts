/* Daum(카카오) 우편번호 검색 — 스크립트 동적 로드 후 팝업 오픈 */

type PostcodeData = { zonecode: string; roadAddress: string; jibunAddress: string };

function loadDaumPostcode(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    const w = window as unknown as { daum?: { Postcode: unknown } };
    if (w.daum?.Postcode) return resolve();
    const id = "daum-postcode-script";
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.body.appendChild(s);
  });
}

/** 우편번호 검색 팝업 → 선택 시 (우편번호, 도로명/지번 주소) 콜백. 로드 실패 시 false */
export async function openPostcode(onSelect: (zipcode: string, address: string) => void): Promise<boolean> {
  try { await loadDaumPostcode(); } catch { return false; }
  const w = window as unknown as {
    daum: { Postcode: new (opts: { oncomplete: (data: PostcodeData) => void }) => { open: () => void } };
  };
  new w.daum.Postcode({ oncomplete: (d) => onSelect(d.zonecode, d.roadAddress || d.jibunAddress) }).open();
  return true;
}
