// 카카오(다음) 우편번호 검색 공용 헬퍼. 스크립트를 지연 로드 후 팝업을 연다.
function loadDaumPostcode(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { daum?: { Postcode: unknown } };
    if (w.daum?.Postcode) return resolve();
    const id = "daum-postcode-script";
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) { existing.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("postcode load failed"));
    document.body.appendChild(s);
  });
}

/** 우편번호 검색 팝업 → 선택 시 {zipcode, address} 콜백 */
export async function openDaumPostcode(onComplete: (r: { zipcode: string; address: string }) => void) {
  await loadDaumPostcode();
  const w = window as unknown as {
    daum: { Postcode: new (o: { oncomplete: (d: { zonecode: string; roadAddress: string; jibunAddress: string }) => void }) => { open: () => void } };
  };
  new w.daum.Postcode({
    oncomplete: (d) => onComplete({ zipcode: d.zonecode, address: d.roadAddress || d.jibunAddress }),
  }).open();
}
