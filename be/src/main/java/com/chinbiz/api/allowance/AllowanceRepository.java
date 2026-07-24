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
}
