package com.chinbiz.api.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MembershipPaymentRepository extends JpaRepository<MembershipPayment, Long>, JpaSpecificationExecutor<MembershipPayment> {

    List<MembershipPayment> findByPayerTypeAndPayerIdOrderByIdDesc(String payerType, Long payerId);

    Optional<MembershipPayment> findByOrderId(String orderId);

    /** 회원이 MP수당으로 결제한 누적액 (사용가능 MP 산정 시 차감) */
    @Query("select coalesce(sum(p.amount),0) from MembershipPayment p " +
           "where p.payerLoginId = :loginId and p.method = 'MP'")
    long sumMpUsed(@Param("loginId") String loginId);
}
