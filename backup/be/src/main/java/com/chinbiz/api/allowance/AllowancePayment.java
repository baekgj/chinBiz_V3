package com.chinbiz.api.allowance;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 정산(수당지급) 테이블 — 회원·확정월 단위로 지급 대상 수당을 집계·지급 관리.
 *  member_type 은 Allowance.MemberType 재사용(8종).
 */
@Entity
@Table(name = "allowance_payment")
public class AllowancePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", length = 60) private String memberId;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_type", length = 20) private Allowance.MemberType memberType;

    @Column(name = "fixed_month", length = 6) private String fixedMonth;      // 확정월(YYYYMM)
    @Column(name = "payment_amount") private Long paymentAmount;              // 지급금액(원)
    @Column(name = "created_date") private LocalDateTime createdDate;         // 생성일시

    @Column(name = "payment_flag", columnDefinition = "char(1) default 'N'") private String paymentFlag = "N"; // 지급여부(기본 N)
    @Column(name = "payment_date") private LocalDateTime paymentDate;         // 지급일시

    @Column(name = "account_holder", length = 50) private String accountHolder;     // 예금주
    @Column(name = "account_number", length = 40) private String accountNumber;     // 계좌번호
    @Column(name = "account_bankname", length = 40) private String accountBankname; // 은행명

    @PrePersist void onCreate() { if (createdDate == null) createdDate = LocalDateTime.now(); if (paymentFlag == null) paymentFlag = "N"; }

    // --- getters / setters ---
    public Long getId() { return id; }
    public String getMemberId() { return memberId; } public void setMemberId(String v) { memberId = v; }
    public Allowance.MemberType getMemberType() { return memberType; } public void setMemberType(Allowance.MemberType v) { memberType = v; }
    public String getFixedMonth() { return fixedMonth; } public void setFixedMonth(String v) { fixedMonth = v; }
    public Long getPaymentAmount() { return paymentAmount; } public void setPaymentAmount(Long v) { paymentAmount = v; }
    public LocalDateTime getCreatedDate() { return createdDate; } public void setCreatedDate(LocalDateTime v) { createdDate = v; }
    public String getPaymentFlag() { return paymentFlag; } public void setPaymentFlag(String v) { paymentFlag = v; }
    public LocalDateTime getPaymentDate() { return paymentDate; } public void setPaymentDate(LocalDateTime v) { paymentDate = v; }
    public String getAccountHolder() { return accountHolder; } public void setAccountHolder(String v) { accountHolder = v; }
    public String getAccountNumber() { return accountNumber; } public void setAccountNumber(String v) { accountNumber = v; }
    public String getAccountBankname() { return accountBankname; } public void setAccountBankname(String v) { accountBankname = v; }
}
