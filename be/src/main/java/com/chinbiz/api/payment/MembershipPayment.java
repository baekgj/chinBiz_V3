package com.chinbiz.api.payment;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 회비/입점비 결제 내역 (매니저·센터 회비, 파트너 입점비).
 * 결제 감사·MP수당 사용 추적용 (원장 무결성: allowance 원장은 건드리지 않고 별도 기록).
 */
@Entity
@Table(name = "membership_payment")
public class MembershipPayment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payer_type", length = 10) private String payerType;   // USER | PARTNER
    @Column(name = "payer_id") private Long payerId;                      // user.id | partner.id
    @Column(name = "payer_login_id", length = 60) private String payerLoginId; // userId | partnerId
    @Column(name = "payer_name", length = 120) private String payerName;  // 회원명(user.name) | 상호명(partner.company_name)
    @Column(name = "role", length = 20) private String role;             // MANAGER | CENTER_ADMIN | PARTNER
    @Column(name = "fee_type", length = 12) private String feeType;      // MONTHLY | YEARLY | ENTRY
    @Column(name = "method", length = 12) private String method;         // CARD | VBANK | TRANSFER | EASYPAY | MP
    @Column(name = "base_fee") private Long baseFee;                     // 설정된 회비/입점비(원)
    @Column(name = "vat") private Long vat;                              // 부가세(원)
    @Column(name = "amount") private Long amount;                        // 실제 결제금액(MP=부가세 제외)
    @Column(name = "expiry_after") private LocalDate expiryAfter;        // 결제 후 회원만기일자(회비만)

    // 토스페이먼츠 연동
    @Column(name = "order_id", length = 64, unique = true) private String orderId;   // 가맹점 주문번호(토스 orderId)
    @Column(name = "payment_key", length = 200) private String paymentKey;           // 토스 결제키(승인 후)
    @Column(name = "status", length = 20) private String status = "PENDING";         // PENDING|DONE|WAITING_DEPOSIT|CANCELED

    // 세금계산서/현금영수증 (가상계좌·계좌이체 결제 대상)
    @Column(name = "receipt_type", length = 20) private String receiptType;          // TAX_INVOICE | CASH_RECEIPT
    @Column(name = "receipt_status", length = 20) private String receiptStatus;      // REQUESTED | ISSUED | FAILED
    @Column(name = "receipt_key", length = 300) private String receiptKey;           // 발행 참조(영수증키/URL)

    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getPayerType() { return payerType; } public void setPayerType(String v) { payerType = v; }
    public Long getPayerId() { return payerId; } public void setPayerId(Long v) { payerId = v; }
    public String getPayerLoginId() { return payerLoginId; } public void setPayerLoginId(String v) { payerLoginId = v; }
    public String getPayerName() { return payerName; } public void setPayerName(String v) { payerName = v; }
    public String getRole() { return role; } public void setRole(String v) { role = v; }
    public String getFeeType() { return feeType; } public void setFeeType(String v) { feeType = v; }
    public String getMethod() { return method; } public void setMethod(String v) { method = v; }
    public Long getBaseFee() { return baseFee; } public void setBaseFee(Long v) { baseFee = v; }
    public Long getVat() { return vat; } public void setVat(Long v) { vat = v; }
    public Long getAmount() { return amount; } public void setAmount(Long v) { amount = v; }
    public LocalDate getExpiryAfter() { return expiryAfter; } public void setExpiryAfter(LocalDate v) { expiryAfter = v; }
    public String getOrderId() { return orderId; } public void setOrderId(String v) { orderId = v; }
    public String getPaymentKey() { return paymentKey; } public void setPaymentKey(String v) { paymentKey = v; }
    public String getStatus() { return status; } public void setStatus(String v) { status = v; }
    public String getReceiptType() { return receiptType; } public void setReceiptType(String v) { receiptType = v; }
    public String getReceiptStatus() { return receiptStatus; } public void setReceiptStatus(String v) { receiptStatus = v; }
    public String getReceiptKey() { return receiptKey; } public void setReceiptKey(String v) { receiptKey = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
