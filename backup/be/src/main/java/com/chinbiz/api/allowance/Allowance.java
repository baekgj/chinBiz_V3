package com.chinbiz.api.allowance;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 수당(Allowance) 원장.
 * PK = (유형, 주문번호, 회원구분, 회원ID) 복합키.
 * 순번(seq)은 DB auto_increment 보조 키(정렬/조회용).
 */
@Entity
@Table(name = "allowance")
@IdClass(AllowanceId.class)
public class Allowance {

    /** 유형 (JOIN=가입 추천마일리지) */
    public enum Type { ORDER, CANCEL, CANCEL_FEE, JOIN }
    /** 회원구분 (DIVISION=본부 추가) */
    public enum MemberType { BUZZ, TOPBUZZ, MANAGER, BUZZ_CENTER, MANAGER_CENTER, DIVISION, HQ, MASTER }
    /** 수당상태 */
    public enum Status { CP, MP }

    /** 순번 (auto_increment, 비-PK 보조키) */
    @Column(name = "seq", columnDefinition = "BIGINT AUTO_INCREMENT UNIQUE", insertable = false, updatable = false)
    private Long seq;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20, nullable = false)
    private Type type;

    @Id
    @Column(name = "order_no", length = 60, nullable = false)
    private String orderNo;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "member_type", length = 20, nullable = false)
    private MemberType memberType;

    @Id
    @Column(name = "member_id", length = 60, nullable = false)
    private String memberId;

    /** 수당상태 (CP=예정, MP=확정) */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10)
    private Status status;

    @Column(name = "product_id") private Long productId;      // 상품번호
    @Column(name = "partner_id") private Long partnerId;      // 파트너사ID
    @Column(name = "amount") private Long amount = 0L;        // 수당금액(원)

    @Column(name = "contract_date") private LocalDate contractDate;   // 계약일자
    @Column(name = "confirm_date") private LocalDate confirmDate;     // 구매확정일자

    @Column(name = "fixed_date") private LocalDateTime fixedDate;      // 확정일자
    @Column(name = "fixed_month", length = 6) private String fixedMonth; // 확정월(YYYYMM)

    @Column(name = "paid", nullable = false) private boolean paid = false; // 지급여부
    @Column(name = "paid_date") private LocalDate paidDate;                 // 지급일자

    @Column(name = "account_number", length = 40) private String accountNumber; // 계좌번호
    @Column(name = "bank_name", length = 40) private String bankName;           // 은행명
    @Column(name = "account_holder", length = 50) private String accountHolder; // 예금주
    @Column(name = "handler_id", length = 60) private String handlerId;         // 처리담당자

    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }

    // --- getters / setters ---
    public Long getSeq() { return seq; }
    public Type getType() { return type; } public void setType(Type v) { type = v; }
    public String getOrderNo() { return orderNo; } public void setOrderNo(String v) { orderNo = v; }
    public MemberType getMemberType() { return memberType; } public void setMemberType(MemberType v) { memberType = v; }
    public String getMemberId() { return memberId; } public void setMemberId(String v) { memberId = v; }
    public Status getStatus() { return status; } public void setStatus(Status v) { status = v; }
    public Long getProductId() { return productId; } public void setProductId(Long v) { productId = v; }
    public Long getPartnerId() { return partnerId; } public void setPartnerId(Long v) { partnerId = v; }
    public Long getAmount() { return amount; } public void setAmount(Long v) { amount = v; }
    public LocalDate getContractDate() { return contractDate; } public void setContractDate(LocalDate v) { contractDate = v; }
    public LocalDate getConfirmDate() { return confirmDate; } public void setConfirmDate(LocalDate v) { confirmDate = v; }
    public LocalDateTime getFixedDate() { return fixedDate; } public void setFixedDate(LocalDateTime v) { fixedDate = v; }
    public String getFixedMonth() { return fixedMonth; } public void setFixedMonth(String v) { fixedMonth = v; }
    public boolean isPaid() { return paid; } public void setPaid(boolean v) { paid = v; }
    public LocalDate getPaidDate() { return paidDate; } public void setPaidDate(LocalDate v) { paidDate = v; }
    public String getAccountNumber() { return accountNumber; } public void setAccountNumber(String v) { accountNumber = v; }
    public String getBankName() { return bankName; } public void setBankName(String v) { bankName = v; }
    public String getAccountHolder() { return accountHolder; } public void setAccountHolder(String v) { accountHolder = v; }
    public String getHandlerId() { return handlerId; } public void setHandlerId(String v) { handlerId = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
