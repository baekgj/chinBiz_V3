import { PageHead } from "@/components/division/DivisionUI";
import DivisionSettlementSection from "@/components/division/sections/DivisionSettlementSection";

export default function DivisionSettlementLedgerPage() {
  return (
    <div>
      <PageHead title="정산원장" sub="본부 배정 전표 로그 (Insert-Only)" />
      <DivisionSettlementSection scope="ledger" />
    </div>
  );
}
