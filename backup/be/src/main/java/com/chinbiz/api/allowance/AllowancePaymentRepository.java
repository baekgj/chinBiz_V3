package com.chinbiz.api.allowance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AllowancePaymentRepository extends JpaRepository<AllowancePayment, Long> {
    List<AllowancePayment> findByMemberIdOrderByIdDesc(String memberId);
    List<AllowancePayment> findByMemberIdAndFixedMonth(String memberId, String fixedMonth);

    /** 정산현황 리스트 — 회원+구분(들) (최신순). 월 필터는 서비스단에서 처리 */
    List<AllowancePayment> findByMemberIdAndMemberTypeInOrderByIdDesc(String memberId, Collection<Allowance.MemberType> types);

    /** 누적 정산금액 합산 (대시보드 누적 확정MP) */
    @Query("select coalesce(sum(p.paymentAmount),0) from AllowancePayment p where p.memberId = :mid and p.memberType in :types")
    long sumCumulative(@Param("mid") String mid, @Param("types") Collection<Allowance.MemberType> types);

    /** [본사 정산내역/지급내역] fixed_month=검색월 + payment_flag(N/Y) */
    List<AllowancePayment> findByFixedMonthAndPaymentFlagOrderByIdDesc(String fixedMonth, String paymentFlag);

    /** 지급여부별 건수 (대시보드 처리대기: payment_flag=N=출금승인 대기) */
    long countByPaymentFlag(String paymentFlag);
}
