"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { krw } from "@/components/ui";
import { Card, GoldBadge } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet, mediaUrl } from "@/lib/api";
import { rewardAmount } from "@/lib/reward";
import { sanitizeHtml } from "@/lib/sanitize";
import { computeDday, canApplySale } from "@/lib/dday";
import Link from "next/link";

type Detail = Record<string, unknown> & {
  id: number; name: string; salePrice: number; totalAllowance: number; rewardType: string;
  partnerName?: string; categoryName?: string; categoryId?: number | null; description?: string; installPolicy?: string; returnPolicy?: string;
  buzzReward?: number; chinkuReward?: number; managerReward?: number;
  image1?: string; image2?: string; image3?: string; image4?: string; image5?: string;
  contractEndDate?: string | null;
  installProduct?: boolean; simpleDelivery?: boolean; cancelFeeFlag?: boolean; cancelAmount?: number;
};

/** 상품 상세 — 수당내역은 역할별 표시(버즈: 버즈·추천인 / 매니저: 매니저·버즈·추천인) */
export default function ProductDetail({ id }: { id: string }) {
  const { theme, isManager } = useBuzz();
  const router = useRouter();
  const [p, setP] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const as = isManager ? "manager" : "buzz"; // 역할별 상품설명(docs/18)
    apiGet<Detail>(`/api/buzz/products/${id}?as=${as}`).then((r) => {
      if (r.ok && r.data) setP(r.data); else setErr(r.message ?? "상품을 찾을 수 없습니다.");
    });
  }, [id, isManager]);

  if (err) return <p className="text-sm text-red-500">{err}</p>;
  if (!p) return <p className={`text-sm ${theme.cardSub}`}>불러오는 중…</p>;

  const isRate = p.rewardType === "RATE";
  const images = [p.image1, p.image2, p.image3, p.image4, p.image5].filter(Boolean) as string[];
  const dd = computeDday(p.contractEndDate);
  // 버즈 뷰 + 7일 이상 남은 상품만 1차영업신청 가능 (카테고리·상품 자동선택)
  const showApply = !isManager && canApplySale(p.contractEndDate);
  const applyHref = `/buzz/pipeline/new?productId=${p.id}${p.categoryId ? `&categoryId=${p.categoryId}` : ""}`;

  // 역할별 노출 수당 항목 (금액 = RATE: 총수당×비율, FIXED: 저장금액)
  const rewardRows: { label: string; key: "buzzReward" | "chinkuReward" | "managerReward"; pct?: number }[] = isManager
    ? [{ label: "2차 관리매니저", key: "managerReward", pct: p.managerReward }, { label: "1차 버즈회원", key: "buzzReward", pct: p.buzzReward }, { label: "상위 추천회원(친쿠)", key: "chinkuReward", pct: p.chinkuReward }]
    : [{ label: "1차 버즈회원", key: "buzzReward", pct: p.buzzReward }, { label: "상위 추천회원(친쿠)", key: "chinkuReward", pct: p.chinkuReward }];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => router.back()} className={`rounded-lg px-4 py-2 text-sm font-semibold ${theme.cancelBtn}`}>← 돌아가기</button>
        {/* 우측 상단 1차영업신청 */}
        {showApply && (
          <Link href={applyHref} className={`rounded-lg px-5 py-2 text-sm font-bold ${theme.primaryBtn}`}>1차영업신청</Link>
        )}
      </div>

      {dd?.closingSoon && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-bold text-red-500">[{dd.message}]</p>}

      <Card title={p.name} sub={`${p.partnerName ?? "-"}${p.categoryName ? " · " + p.categoryName : ""}`}
        right={<div className="flex items-center gap-2">
          {dd && <span className={`rounded-md px-2 py-0.5 text-xs font-black ${dd.closingSoon || dd.expired ? "bg-red-600 text-white" : "bg-black/75 text-amber-300"}`}>{dd.label}</span>}
          <GoldBadge>{isRate ? "비율" : "고정"} 수당</GoldBadge>
        </div>}>
        {images.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={mediaUrl(u)} alt={`상품 이미지 ${i + 1}`} className={`h-24 w-full rounded-lg border object-cover ${theme.tableWrap}`} />
            ))}
          </div>
        )}
        <div className={`rounded-xl border p-4 ${theme.tableWrap}`}>
          <p className={`text-xs ${theme.cardSub}`}>판매가</p>
          <p className={`mt-1 text-xl font-black ${theme.cellMain}`}>{krw(p.salePrice)}</p>
        </div>
      </Card>

      <Card title="내 수당 내역" sub={isManager ? "관리매니저 기준 (매니저·버즈·추천인)" : "버즈회원 기준 (버즈·추천인)"}>
        <div className="space-y-2">
          {rewardRows.map((r) => (
            <div key={r.label} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${theme.tableWrap}`}>
              <span className={`text-sm font-semibold ${theme.cellMain}`}>{r.label}{isRate ? <span className={`ml-1 text-xs font-normal ${theme.note}`}>({r.pct ?? 0}%)</span> : null}</span>
              <span className={`text-sm font-black ${theme.statTone.green}`}>{krw(rewardAmount(p, r.key))}</span>
            </div>
          ))}
        </div>
        <p className={`mt-3 text-xs ${theme.note}`}>※ 센터·본부·본사 등 그 외 분배 항목은 표시되지 않습니다.</p>
      </Card>

      {(p.description || p.installPolicy || p.returnPolicy || p.installProduct || p.simpleDelivery || p.cancelFeeFlag) && (
        <Card title="상품 설명 및 규정">
          {/* 상품 유형 안내 (설치/단순배송/취소보전비) */}
          {(p.installProduct || p.simpleDelivery || p.cancelFeeFlag) && (
            <div className={`mb-3 space-y-1 rounded-lg border p-3 ${theme.tableWrap}`}>
              {p.installProduct && <p className={`text-sm font-semibold ${theme.cellMain}`}>· 본 제품은 설치 및 교육대상 상품입니다.</p>}
              {p.simpleDelivery && <p className={`text-sm font-semibold ${theme.cellMain}`}>· 본 제품은 배송상품이며, 설치나 교육이 진행되지 않습니다.</p>}
              {p.cancelFeeFlag && <p className={`text-sm font-semibold ${theme.cellMain}`}>· 설치후 주문취소시 영업보전비 {(p.cancelAmount ?? 0).toLocaleString()}원 지급되는 상품입니다.</p>}
            </div>
          )}
          {p.description && <div className={`rte-content text-sm ${theme.cellMain}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.description) }} />}
          {p.installPolicy && <p className={`mt-3 text-sm ${theme.cellSub}`}><b>설치 규정</b> · {p.installPolicy}</p>}
          {p.returnPolicy && <p className={`mt-1 text-sm ${theme.cellSub}`}><b>반품/취소 규정</b> · {p.returnPolicy}</p>}
        </Card>
      )}

      {/* 우측 하단 1차영업신청 */}
      {showApply && (
        <div className="flex justify-end">
          <Link href={applyHref} className={`rounded-xl px-6 py-2.5 text-sm font-bold ${theme.primaryBtn}`}>1차영업신청</Link>
        </div>
      )}
    </div>
  );
}
