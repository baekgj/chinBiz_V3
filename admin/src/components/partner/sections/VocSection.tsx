import { Card } from "@/components/partner/PartnerUI";

const VOC = [
  { tag: "긴급 · 설치 지연", place: "종로가든", text: "매니저 방문 일정이 조율되지 않아 주방 오픈에 차질", via: "외부_정매니저", done: false },
  { tag: "일반 · 상품 문의", place: "대박식당 신촌점", text: "세척기 전용 세제 추가 구매 경로 문의", via: "버즈_김OO", done: true },
];

/** 파트너 · VOC(민원) 센터 */
export default function VocSection() {
  return (
    <Card title="VOC 센터 · 고객 민원접수 현황" sub="1차 버즈·2차 매니저를 통해 인입된 현장 클레임 확인 및 조치"
      right={
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-red-50 px-2.5 py-1 font-bold text-red-600 ring-1 ring-red-200">미처리 2건</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 ring-1 ring-emerald-200">처리 완료 45건</span>
        </div>
      }>
      <ul className="space-y-3">
        {VOC.map((v) => (
          <li key={v.place} className={`rounded-xl border p-4 ${v.done ? "border-slate-200 bg-slate-50" : "border-red-200 bg-red-50/50"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${v.done ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200"}`}>
                  {v.done ? "처리 완료" : v.tag}
                </span>
                <span className="font-bold text-slate-900">{v.place}</span>
              </div>
              <span className="text-xs text-slate-400">접수: {v.via}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">&ldquo;{v.text}&rdquo;</p>
            {!v.done && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700">즉시 조치 가이드 발송</button>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">본사 소통 팝업</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
