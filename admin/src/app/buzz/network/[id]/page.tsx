"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/buzz/BuzzUI";
import MemberForm from "@/components/buzz/MemberForm";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet } from "@/lib/api";

export default function BuzzMemberEditPage() {
  const params = useParams<{ id: string }>();
  const { theme } = useBuzz();
  const [data, setData] = useState<(Record<string, unknown> & { id?: number }) | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    apiGet<Record<string, unknown> & { id?: number }>(`/api/buzz/members/${params.id}`).then((r) => {
      if (r.ok && r.data) setData(r.data); else setErr(r.message ?? "회원을 찾을 수 없습니다.");
    });
  }, [params?.id]);

  return (
    <div>
      <PageHead title="회원 정보 보기" sub="내 네트워크 회원 정보 (읽기 전용)" />
      {err ? <p className="text-sm text-red-500">{err}</p>
        : data ? <MemberForm mode="edit" initial={data} />
        : <p className={`text-sm ${theme.cardSub}`}>불러오는 중…</p>}
    </div>
  );
}
