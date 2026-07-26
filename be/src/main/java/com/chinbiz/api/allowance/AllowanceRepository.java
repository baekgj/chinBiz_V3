package com.chinbiz.api.allowance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface AllowanceRepository extends JpaRepository<Allowance, AllowanceId>, JpaSpecificationExecutor<Allowance> {
    List<Allowance> findByOrderNo(String orderNo);
    List<Allowance> findByOrderNoAndType(String orderNo, Allowance.Type type);

    /** 정산현황용 — 회원(member_id)+회원구분(들) 원장 (최신순) */
    List<Allowance> findByMemberIdAndMemberTypeInOrderBySeqDesc(String memberId, Collection<Allowance.MemberType> types);
    /** 수당지급현황용 — 회원(member_id)+회원구분(들)+상태(MP 확정) 원장 (최신순) */
    List<Allowance> findByMemberIdAndMemberTypeInAndStatusOrderBySeqDesc(String memberId, Collection<Allowance.MemberType> types, Allowance.Status status);

    /** 파트너 정산 원장 — 해당 파트너사 상품(partner_id)의 전체 전표 (최신순) */
    List<Allowance> findByPartnerIdOrderBySeqDesc(Long partnerId);

    /** 특정 회원(member_id)·상태·회원구분(들)의 기간 내 수당 합산 (대시보드 CP/MP용) */
    @Query("select coalesce(sum(a.amount),0) from Allowance a " +
           "where a.memberId = :mid and a.status = :status and a.memberType in :types " +
           "and a.createdAt >= :from and a.createdAt < :to")
    long sumMonthly(@Param("mid") String mid, @Param("status") Allowance.Status status,
                    @Param("types") Collection<Allowance.MemberType> types,
                    @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** 대시보드 패널티/보전: 회원+구분(들)+상태+전표유형(CANCEL_FEE 등)의 기간 내 합산 */
    @Query("select coalesce(sum(a.amount),0) from Allowance a " +
           "where a.memberId = :mid and a.status = :status and a.memberType in :types and a.type = :tx " +
           "and a.createdAt >= :from and a.createdAt < :to")
    long sumMonthlyByTx(@Param("mid") String mid, @Param("status") Allowance.Status status,
                        @Param("types") Collection<Allowance.MemberType> types, @Param("tx") Allowance.Type tx,
                        @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** 수당현황 리스트: 회원+구분(들)+상태(들) (월 필터는 서비스단에서 targetMonth 로 처리) */
    List<Allowance> findByMemberIdAndMemberTypeInAndStatusInOrderByCreatedAtDesc(
            String memberId, Collection<Allowance.MemberType> types, Collection<Allowance.Status> statuses);

    /** [본사 매출현황] status=MP, paid=false, fixed_month=null, confirm_date=검색월 */
    @Query("select a from Allowance a where a.status = :status and a.paid = false and a.fixedMonth is null " +
           "and a.confirmDate >= :from and a.confirmDate < :to order by a.seq desc")
    List<Allowance> findSalesForClose(@Param("status") Allowance.Status status,
                                      @Param("from") java.time.LocalDate from, @Param("to") java.time.LocalDate to);

    /** [본사 마감내역/정산완료] fixed_month=검색월, paid=false */
    List<Allowance> findByFixedMonthAndPaidFalse(String fixedMonth);
}
