"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHead, Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet } from "@/lib/api";

type Sale = Record<string, unknown> & {
  id: number; createdAt: string; productId?: number; productName?: string; partnerName?: string; status?: string;
  companyName?: string; businessNumber?: string; ceoName?: string; companyPhone?: string;
  managerName?: string; phone?: string; email?: string; zipcode?: string; address?: string; addressDetail?: string; memo?: string;
};

export default function BuzzSaleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useBuzz();
  const [s, setS] = useState<Sale | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    apiGet<Sale>(`/api/buzz/sales/${params.id}`).then((r) => { if (r.ok && r.data) setS(r.data); else setErr(r.message ?? "영업 건을 찾을 수 없습니다."); });
  }, [params?.id]);

  const Row = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex justify-between gap-4 border-b py-2 last:border-0" style={{ borderColor: "transparent" }}>
      <span className={`text-xs font-semibold ${theme.fieldLabel}`}>{label}</span>
      <span className={`text-sm ${theme.cellMain}`}>{value || "-"}</span>
    </div>
  );

  return (
    <div>
      <PageHead title="1차 영업 상세" sub="등록한 영업 정보" />
      <button onClick={() => router.back()} className={`mb-4 rounded-lg px-4 py-2 text-sm font-semibold ${theme.cancelBtn}`}>← 돌아가기</button>
      {err ? <p className="text-sm text-red-500">{err}</p>
        : !s ? <p className={`text-sm ${theme.cardSub}`}>불러오는 중…</p>
        : (
          <div className="space-y-5">
            <Card title="영업 정보" right={<span className={`rounded-full px-2 py-0.5 text-xs font-bold ${theme.stageOn}`}>{s.status}</span>}>
              <Row label="등록일" value={s.createdAt} />
              <Row label="상품명" value={s.productName} />
              <Row label="파트너사" value={s.partnerName} />
              {s.productId && <div className="mt-2"><Link href={`/buzz/market/${s.productId}`} className={`text-xs font-bold underline ${theme.accent}`}>상품 상세 보기 →</Link></div>}
            </Card>
            <Card title="고객 기본정보">
              <Row label="상호명" value={s.companyName} />
              <Row label="사업자등록번호" value={s.businessNumber} />
              <Row label="대표자명" value={s.ceoName} />
              <Row label="회사 전화번호" value={s.companyPhone} />
              <Row label="담당자명" value={s.managerName} />
              <Row label="핸드폰번호" value={s.phone} />
              <Row label="이메일" value={s.email} />
              <Row label="주소" value={[s.zipcode, s.address, s.addressDetail].filter(Boolean).join(" ")} />
            </Card>
            {s.memo && <Card title="메모"><p className={`whitespace-pre-wrap text-sm ${theme.cellMain}`}>{s.memo}</p></Card>}
          </div>
        )}
    </div>
  );
}
