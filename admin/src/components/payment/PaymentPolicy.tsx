"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";

type Term = { code: string; title: string; content: string | null };
type PayInfo = { membershipExpiry?: string | null; expired?: boolean };

function looksHtml(s: string) { return /<\/?[a-z][\s\S]*>/i.test(s); }

function TermBox({ term, fallbackTitle }: { term: Term | null | undefined; fallbackTitle: string }) {
  const content = term?.content || "";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h3 className="border-b border-slate-200 px-5 py-3.5 text-base font-black text-slate-900">{term?.title || fallbackTitle}</h3>
      <div className="max-h-[420px] overflow-y-auto px-5 py-4">
        {term === undefined ? (
          <p className="text-sm text-slate-400">불러오는 중…</p>
        ) : !content ? (
          <p className="text-sm text-slate-500">등록된 내용이 없습니다.</p>
        ) : looksHtml(content) ? (
          <div className="rte-content text-sm leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{content}</div>
        )}
      </div>
    </div>
  );
}

/**
 * [결제] 메뉴 진입 화면 (docs/36) — 이용권 안내 + 유료서비스 결제 및 환불정책을 보여주고
 * 하단 [동의하기] 클릭 시 회비결제 화면(payPath)으로 이동.
 * 회비 만기 회원은 PaymentGate 에 의해 이 화면과 회비결제 화면만 이용 가능.
 */
export default function PaymentPolicy({ ticketCode, ticketTitle, payPath }: { ticketCode: string; ticketTitle: string; payPath: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Term | null | undefined>(undefined);
  const [refund, setRefund] = useState<Term | null | undefined>(undefined);
  const [info, setInfo] = useState<PayInfo | null>(null);

  useEffect(() => {
    apiGet<Term>(`/api/public/terms/${ticketCode}`).then((r) => setTicket(r.ok && r.data ? r.data : null));
    apiGet<Term>("/api/public/terms/PAID_SERVICE_REFUND").then((r) => setRefund(r.ok && r.data ? r.data : null));
    apiGet<PayInfo>("/api/payment/info").then((r) => { if (r.ok && r.data) setInfo(r.data); });
  }, [ticketCode]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {info?.expired && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
          회원 만기일자({info.membershipExpiry || "-"})가 지났습니다. 아래 내용을 확인하고 동의한 뒤 회비를 결제하시면 전체 메뉴를 이용할 수 있습니다.
        </div>
      )}
      <TermBox term={ticket} fallbackTitle={ticketTitle} />
      <TermBox term={refund} fallbackTitle="유료서비스 결제 및 환불정책" />
      <button onClick={() => router.push(payPath)}
        className="w-full rounded-xl bg-sky-600 px-6 py-3.5 text-center text-sm font-black text-white hover:bg-sky-500">
        동의하기
      </button>
    </div>
  );
}
